using FluentValidation;
using staff_application.DTOs;

namespace staff_application.Validators;

public class CreateStaffMemberValidator : AbstractValidator<CreateStaffMemberRequest>
{
    public CreateStaffMemberValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name is required")
            .MaximumLength(100)
            .WithMessage("First name must not exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name is required")
            .MaximumLength(100)
            .WithMessage("Last name must not exceed 100 characters");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .MaximumLength(255)
            .WithMessage("Email must not exceed 255 characters")
            .EmailAddress()
            .WithMessage("Email must be a valid email address");

        RuleFor(x => x.Phone)
            .MaximumLength(50)
            .WithMessage("Phone must not exceed 50 characters")
            .When(x => x.Phone != null);

        RuleFor(x => x.JobTitle)
            .MaximumLength(100)
            .WithMessage("Job title must not exceed 100 characters")
            .When(x => x.JobTitle != null);

        RuleFor(x => x.PhotoUrl)
            .MaximumLength(500)
            .WithMessage("Photo URL must not exceed 500 characters")
            .Must(BeAValidUrl)
            .WithMessage("Photo URL must be a valid URL")
            .When(x => x.PhotoUrl != null);

        RuleFor(x => x.PermissionLevel)
            .IsInEnum()
            .WithMessage("Permission level must be a valid value");
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return true;

        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}
