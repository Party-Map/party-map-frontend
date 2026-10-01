import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormContext } from "react-hook-form";
import { Link } from "react-router";
import { z } from "zod";

import { ApiError } from "@/api/client";
import { Field, Input } from "@/components/Field";
import { renderWithProviders } from "@/test/helpers";

import { type Step, StepForm } from "./StepForm";

const schema = z
    .object({ name: z.string().trim().min(1, "Name is required."), from: z.string(), to: z.string() })
    .refine((v) => v.to === "" || v.to > v.from, { path: ["to"], message: "To must be after from." });
type Values = z.input<typeof schema>;

function TextField({ name, label }: { name: keyof Values; label: string }) {
    const {
        register,
        formState: { errors },
    } = useFormContext<Values>();
    return (
        <Field label={label} error={errors[name]?.message}>
            {(id) => <Input id={id} {...register(name)} />}
        </Field>
    );
}

const steps: Step<Values>[] = [
    {
        id: "who",
        title: "Who",
        description: "The name.",
        fields: ["name"],
        render: () => <TextField name="name" label="Name" />,
    },
    {
        id: "when",
        title: "When",
        fields: ["from", "to"],
        render: () => (
            <>
                <TextField name="from" label="From" />
                <TextField name="to" label="To" />
            </>
        ),
    },
];

const empty: Values = { name: "", from: "", to: "" };

function renderForm(
    options: {
        mode?: "create" | "edit";
        defaultValues?: Values;
        onSubmit?: (v: z.output<typeof schema>) => Promise<void>;
    } = {},
) {
    const onSubmit = options.onSubmit ?? vi.fn(async () => {});
    const view = renderWithProviders(
        <>
            <StepForm
                mode={options.mode ?? "create"}
                schema={schema}
                steps={steps}
                defaultValues={options.defaultValues ?? empty}
                summary={(v) => [
                    { stepId: "who", label: "Name", value: v.name || "—" },
                    { stepId: "when", label: "Time", value: `${v.from}–${v.to}` },
                ]}
                onSubmit={onSubmit}
                submitLabel="Create"
                cancelTo="/admin/list"
                errorMessage="Could not save."
            />
            <Link to="/elsewhere">Leave</Link>
        </>,
        { route: "/admin/new", path: "/admin/new", dataRouter: true },
    );
    return { ...view, onSubmit };
}

const stepButton = (name: RegExp) =>
    within(screen.getByRole("navigation", { name: "Form steps" })).getByRole("button", { name });

describe("StepForm", () => {
    it("starts at the first step with the later steps locked", () => {
        renderForm();

        expect(screen.getByRole("heading", { name: "Who" })).toBeInTheDocument();
        expect(screen.getByText("The name.")).toBeInTheDocument();
        expect(screen.getAllByText("Step 1 of 3")[0]).toBeInTheDocument();
        expect(stepButton(/Who/)).toHaveAttribute("aria-current", "step");
        expect(stepButton(/When/)).toBeDisabled();
        expect(stepButton(/Review/)).toBeDisabled();
        expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/admin/list");
    });

    it("keeps the user on a step until its fields are valid", async () => {
        renderForm();

        await userEvent.click(screen.getByRole("button", { name: "Next" }));

        expect(await screen.findByText("Name is required.")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Who" })).toBeInTheDocument();
        expect(screen.getByLabelText("Name")).toHaveFocus();
    });

    it("moves on with Enter, keeps values when going back, and unlocks visited steps", async () => {
        renderForm();

        await userEvent.type(screen.getByLabelText("Name"), "Jane{Enter}");

        expect(await screen.findByRole("heading", { name: "When" })).toBeInTheDocument();
        expect(stepButton(/Who/)).toBeEnabled();
        expect(screen.getByRole("button", { name: "Continue to review" })).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByLabelText("Name")).toHaveValue("Jane");
        await userEvent.click(stepButton(/When/));
        expect(screen.getByRole("heading", { name: "When" })).toBeInTheDocument();
    });

    it("validates rules across a step's fields", async () => {
        renderForm({ defaultValues: { name: "Jane", from: "b", to: "a" } });
        await userEvent.click(screen.getByRole("button", { name: "Next" }));

        await userEvent.click(await screen.findByRole("button", { name: "Continue to review" }));

        expect(await screen.findByText("To must be after from.")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "When" })).toBeInTheDocument();
    });

    it("reviews every value by step, jumps back to edit one, and saves the parsed values", async () => {
        const { onSubmit } = renderForm();
        await userEvent.type(screen.getByLabelText("Name"), "  Jane ");
        await userEvent.click(screen.getByRole("button", { name: "Next" }));
        await userEvent.type(await screen.findByLabelText("From"), "a");
        await userEvent.type(screen.getByLabelText("To"), "b");
        await userEvent.click(screen.getByRole("button", { name: "Continue to review" }));

        const who = await screen.findByRole("region", { name: "Who" });
        expect(within(who).getByText("Name")).toBeInTheDocument();
        expect(within(screen.getByRole("region", { name: "When" })).getByText("a–b")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Edit Who" }));
        expect(screen.getByRole("heading", { name: "Who" })).toBeInTheDocument();
        await userEvent.click(stepButton(/Review/));

        await userEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Jane", from: "a", to: "b" }));
    });

    it("shows the API's message when saving fails and stays on the review", async () => {
        const onSubmit = vi.fn(async () => {
            throw new ApiError(409, "Conflict", { detail: "Someone else changed this." });
        });
        renderForm({ mode: "edit", defaultValues: { name: "Jane", from: "", to: "" }, onSubmit });
        await userEvent.click(stepButton(/Review/));

        await userEvent.click(screen.getByRole("button", { name: "Create" }));

        expect(await screen.findByText("Someone else changed this.")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Review" })).toBeInTheDocument();
    });

    it("falls back to its own message for other failures and shows the busy state", async () => {
        let fail: (error: Error) => void = () => {};
        const onSubmit = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
        renderForm({ mode: "edit", defaultValues: { name: "Jane", from: "", to: "" }, onSubmit });
        await userEvent.click(stepButton(/Review/));

        await userEvent.click(screen.getByRole("button", { name: "Create" }));
        expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
        fail(new Error("network"));

        expect(await screen.findByText("Could not save.")).toBeInTheDocument();
    });

    it("lets edit mode open any step and sends the user to a step that fails on save", async () => {
        const { onSubmit } = renderForm({ mode: "edit", defaultValues: { name: "", from: "", to: "" } });

        expect(stepButton(/Review/)).toBeEnabled();
        await userEvent.click(stepButton(/Review/));
        await userEvent.click(screen.getByRole("button", { name: "Create" }));

        expect(await screen.findByRole("heading", { name: "Who" })).toBeInTheDocument();
        expect(stepButton(/Who/)).toHaveAccessibleName(/needs attention/);
        expect(screen.getByText("Name is required.")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();

        await userEvent.click(stepButton(/Review/));
        expect(screen.getByText("Some steps need attention.")).toBeInTheDocument();
        expect(screen.getByText(/needs attention$/, { selector: "span" })).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Edit Who" }));
        await userEvent.type(screen.getByLabelText("Name"), "Jane");
        await userEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(stepButton(/Who/)).not.toHaveAccessibleName(/needs attention/);
    });

    it("asks before leaving with unsaved changes and leaves when confirmed", async () => {
        renderForm();
        await userEvent.type(screen.getByLabelText("Name"), "Jane");

        await userEvent.click(screen.getByRole("link", { name: "Leave" }));
        const dialog = await screen.findByRole("alertdialog", { name: "Leave without saving?" });
        await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
        expect(screen.getByLabelText("Name")).toHaveValue("Jane");

        await userEvent.click(screen.getByRole("link", { name: "Cancel" }));
        await userEvent.click(await screen.findByRole("button", { name: "Leave" }));
        expect(await screen.findByText("other page")).toBeInTheDocument();
    });

    it("warns when closing the tab with unsaved changes", async () => {
        renderForm();
        const event = new Event("beforeunload", { cancelable: true });

        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);

        await userEvent.type(screen.getByLabelText("Name"), "J");
        const dirtyEvent = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(dirtyEvent);
        expect(dirtyEvent.defaultPrevented).toBe(true);
    });

    it("leaves without asking when nothing changed or after saving", async () => {
        const onSubmit = vi.fn(async () => {});
        renderForm({ mode: "edit", defaultValues: { name: "Jane", from: "", to: "" }, onSubmit });

        await userEvent.clear(screen.getByLabelText("Name"));
        await userEvent.type(screen.getByLabelText("Name"), "Janet");
        await userEvent.click(stepButton(/Review/));
        await userEvent.click(screen.getByRole("button", { name: "Create" }));
        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await userEvent.click(screen.getByRole("link", { name: "Leave" }));
        expect(await screen.findByText("other page")).toBeInTheDocument();
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
});
