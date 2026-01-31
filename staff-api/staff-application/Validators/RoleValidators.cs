using FluentValidation;
using staff_application.DTOs;

namespace staff_application.Validators;

public class CreateRoleValidator : AbstractValidator<CreateRoleRequest>
{
    public CreateRoleValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Role name is required")
            .Length(2, 100).WithMessage("Role name must be between 2 and 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}

public class UpdateRoleValidator : AbstractValidator<UpdateRoleRequest>
{
    public UpdateRoleValidator()
    {
        RuleFor(x => x.Name)
            .Length(2, 100).WithMessage("Role name must be between 2 and 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}

public class AssignRoleValidator : AbstractValidator<AssignRoleRequest>
{
    public AssignRoleValidator()
    {
        RuleFor(x => x.StaffMemberId)
            .NotEmpty().WithMessage("Staff member ID is required");

        RuleFor(x => x.LocationId)
            .NotEmpty().WithMessage("Location ID is required");

        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("Role ID is required");
    }
}
