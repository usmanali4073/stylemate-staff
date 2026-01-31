using FluentValidation;
using staff_application.DTOs;

namespace staff_application.Validators;

public class UpdateStaffMemberValidator : AbstractValidator<UpdateStaffMemberRequest>
{
    public UpdateStaffMemberValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name cannot be empty")
            .MaximumLength(100)
            .WithMessage("First name must not exceed 100 characters")
            .When(x => x.FirstName != null);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name cannot be empty")
            .MaximumLength(100)
            .WithMessage("Last name must not exceed 100 characters")
            .When(x => x.LastName != null);

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
            .WithMessage("Permission level must be a valid value")
            .When(x => x.PermissionLevel != null);

        RuleFor(x => x)
            .Must(HaveAtLeastOneField)
            .WithMessage("At least one field must be provided for update");
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return true;

        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }

    private bool HaveAtLeastOneField(UpdateStaffMemberRequest request)
    {
        return request.FirstName != null
            || request.LastName != null
            || request.Phone != null
            || request.JobTitle != null
            || request.PhotoUrl != null
            || request.PermissionLevel != null
            || request.IsBookable != null;
    }
}
