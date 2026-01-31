using FluentValidation;
using staff_application.DTOs;

namespace staff_application.Validators;

public class ChangeStaffStatusValidator : AbstractValidator<ChangeStaffStatusRequest>
{
    private static readonly string[] ValidStatuses = { "active", "suspended", "archived" };

    public ChangeStaffStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .WithMessage("Status is required")
            .Must(BeAValidStatus)
            .WithMessage("Status must be one of: active, suspended, archived");
    }

    private bool BeAValidStatus(string status)
    {
        return ValidStatuses.Contains(status.ToLowerInvariant());
    }
}
