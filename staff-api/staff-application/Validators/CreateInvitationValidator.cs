using FluentValidation;
using staff_application.DTOs;

namespace staff_application.Validators;

public class CreateInvitationValidator : AbstractValidator<CreateInvitationRequest>
{
    public CreateInvitationValidator()
    {
        // Minimal validator - email comes from StaffMember
        // No properties to validate on the request itself
    }
}
