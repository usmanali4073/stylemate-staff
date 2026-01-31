using FluentValidation;
using staff_application.DTOs;

namespace staff_application.Validators;

public class AcceptInvitationValidator : AbstractValidator<AcceptInvitationRequest>
{
    public AcceptInvitationValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty()
            .WithMessage("Token is required");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Password is required")
            .MinimumLength(8)
            .WithMessage("Password must be at least 8 characters")
            .MaximumLength(128)
            .WithMessage("Password must not exceed 128 characters");
    }
}
