using FluentValidation;
using staff_application.DTOs;

namespace staff_application.Validators;

public class CreateRecurringShiftValidator : AbstractValidator<CreateRecurringShiftRequest>
{
    public CreateRecurringShiftValidator()
    {
        RuleFor(x => x.StaffMemberId)
            .NotEmpty()
            .WithMessage("StaffMemberId is required");

        RuleFor(x => x.RRule)
            .NotEmpty()
            .WithMessage("RRule is required")
            .Must(rrule => rrule.Contains("FREQ=", StringComparison.OrdinalIgnoreCase))
            .WithMessage("RRule must contain FREQ parameter");

        RuleFor(x => x.StartTime)
            .NotEmpty()
            .WithMessage("StartTime is required")
            .Matches(@"^([01]\d|2[0-3]):([0-5]\d)$")
            .WithMessage("StartTime must be in HH:mm format");

        RuleFor(x => x.EndTime)
            .NotEmpty()
            .WithMessage("EndTime is required")
            .Matches(@"^([01]\d|2[0-3]):([0-5]\d)$")
            .WithMessage("EndTime must be in HH:mm format");

        RuleFor(x => x)
            .Must(x => IsValidTimeRange(x.StartTime, x.EndTime))
            .WithMessage("StartTime must be before EndTime");

        RuleFor(x => x.PatternStart)
            .NotEmpty()
            .WithMessage("PatternStart is required")
            .Matches(@"^\d{4}-\d{2}-\d{2}$")
            .WithMessage("PatternStart must be in yyyy-MM-dd format");

        RuleFor(x => x.PatternEnd)
            .Matches(@"^\d{4}-\d{2}-\d{2}$")
            .When(x => !string.IsNullOrEmpty(x.PatternEnd))
            .WithMessage("PatternEnd must be in yyyy-MM-dd format");
    }

    private static bool IsValidTimeRange(string startTime, string endTime)
    {
        if (string.IsNullOrEmpty(startTime) || string.IsNullOrEmpty(endTime))
            return true; // Let the other validators handle empty values

        if (!TimeOnly.TryParseExact(startTime, "HH:mm", out var start))
            return true; // Let the format validator handle this

        if (!TimeOnly.TryParseExact(endTime, "HH:mm", out var end))
            return true; // Let the format validator handle this

        return start < end;
    }
}

public class UpdateRecurringShiftValidator : AbstractValidator<UpdateRecurringShiftRequest>
{
    public UpdateRecurringShiftValidator()
    {
        RuleFor(x => x.RRule)
            .Must(rrule => rrule!.Contains("FREQ=", StringComparison.OrdinalIgnoreCase))
            .When(x => !string.IsNullOrEmpty(x.RRule))
            .WithMessage("RRule must contain FREQ parameter");

        RuleFor(x => x.StartTime)
            .Matches(@"^([01]\d|2[0-3]):([0-5]\d)$")
            .When(x => !string.IsNullOrEmpty(x.StartTime))
            .WithMessage("StartTime must be in HH:mm format");

        RuleFor(x => x.EndTime)
            .Matches(@"^([01]\d|2[0-3]):([0-5]\d)$")
            .When(x => !string.IsNullOrEmpty(x.EndTime))
            .WithMessage("EndTime must be in HH:mm format");

        RuleFor(x => x.PatternEnd)
            .Matches(@"^\d{4}-\d{2}-\d{2}$")
            .When(x => !string.IsNullOrEmpty(x.PatternEnd))
            .WithMessage("PatternEnd must be in yyyy-MM-dd format");
    }
}
