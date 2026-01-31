using FluentValidation;
using staff_application.DTOs;

namespace staff_application.Validators;

public class AssignStaffLocationValidator : AbstractValidator<AssignStaffLocationRequest>
{
    public AssignStaffLocationValidator()
    {
        RuleFor(x => x.LocationId)
            .NotEmpty()
            .WithMessage("Location ID is required");
    }
}
