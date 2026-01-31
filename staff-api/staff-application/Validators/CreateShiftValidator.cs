using FluentValidation;
using staff_application.DTOs;

namespace staff_application.Validators;

public class CreateShiftValidator : AbstractValidator<CreateShiftRequest>
{
    public CreateShiftValidator()
    {
        RuleFor(x => x.StaffMemberId)
            .NotEmpty()
            .WithMessage("Staff member ID is required");

        RuleFor(x => x.Date)
            .NotEmpty()
            .WithMessage("Date is required")
            .Must(BeAValidDate)
            .WithMessage("Date must be in yyyy-MM-dd format");

        RuleFor(x => x.StartTime)
            .NotEmpty()
            .WithMessage("Start time is required")
            .Must(BeAValidTime)
            .WithMessage("Start time must be in HH:mm format");

        RuleFor(x => x.EndTime)
            .NotEmpty()
            .WithMessage("End time is required")
            .Must(BeAValidTime)
            .WithMessage("End time must be in HH:mm format");

        RuleFor(x => x)
            .Must(HaveEndTimeAfterStartTime)
            .WithMessage("End time must be after start time")
            .When(x => BeAValidTime(x.StartTime) && BeAValidTime(x.EndTime));

        RuleFor(x => x.ShiftType)
            .NotEmpty()
            .WithMessage("Shift type is required");

        RuleFor(x => x.Notes)
            .MaximumLength(500)
            .WithMessage("Notes must not exceed 500 characters")
            .When(x => x.Notes != null);
    }

    private bool BeAValidDate(string date)
    {
        return DateOnly.TryParseExact(date, "yyyy-MM-dd", out _);
    }

    private bool BeAValidTime(string time)
    {
        return TimeOnly.TryParseExact(time, "HH:mm", out _);
    }

    private bool HaveEndTimeAfterStartTime(CreateShiftRequest request)
    {
        if (!TimeOnly.TryParseExact(request.StartTime, "HH:mm", out var start))
            return false;
        if (!TimeOnly.TryParseExact(request.EndTime, "HH:mm", out var end))
            return false;
        return end > start;
    }
}

public class UpdateShiftValidator : AbstractValidator<UpdateShiftRequest>
{
    public UpdateShiftValidator()
    {
        RuleFor(x => x.Date)
            .Must(BeAValidDate!)
            .WithMessage("Date must be in yyyy-MM-dd format")
            .When(x => x.Date != null);

        RuleFor(x => x.StartTime)
            .Must(BeAValidTime!)
            .WithMessage("Start time must be in HH:mm format")
            .When(x => x.StartTime != null);

        RuleFor(x => x.EndTime)
            .Must(BeAValidTime!)
            .WithMessage("End time must be in HH:mm format")
            .When(x => x.EndTime != null);

        RuleFor(x => x.Notes)
            .MaximumLength(500)
            .WithMessage("Notes must not exceed 500 characters")
            .When(x => x.Notes != null);
    }

    private bool BeAValidDate(string date)
    {
        return DateOnly.TryParseExact(date, "yyyy-MM-dd", out _);
    }

    private bool BeAValidTime(string time)
    {
        return TimeOnly.TryParseExact(time, "HH:mm", out _);
    }
}

public class BulkCreateShiftValidator : AbstractValidator<BulkCreateShiftRequest>
{
    public BulkCreateShiftValidator()
    {
        RuleFor(x => x.Shifts)
            .NotEmpty()
            .WithMessage("At least one shift is required");

        RuleForEach(x => x.Shifts)
            .SetValidator(new CreateShiftValidator());
    }
}
