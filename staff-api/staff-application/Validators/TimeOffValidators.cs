using FluentValidation;
using staff_application.DTOs;
using System.Text.RegularExpressions;

namespace staff_application.Validators;

public class CreateTimeOffRequestValidator : AbstractValidator<CreateTimeOffRequest>
{
    public CreateTimeOffRequestValidator()
    {
        RuleFor(x => x.StaffMemberId)
            .NotEmpty()
            .WithMessage("Staff member ID is required");

        RuleFor(x => x.TimeOffTypeId)
            .NotEmpty()
            .WithMessage("Time-off type ID is required");

        RuleFor(x => x.StartDate)
            .NotEmpty()
            .WithMessage("Start date is required")
            .Must(BeValidDate)
            .WithMessage("Start date must be in yyyy-MM-dd format");

        RuleFor(x => x.EndDate)
            .NotEmpty()
            .WithMessage("End date is required")
            .Must(BeValidDate)
            .WithMessage("End date must be in yyyy-MM-dd format")
            .Must((request, endDate) => BeOnOrAfterStartDate(request.StartDate, endDate))
            .WithMessage("End date must be on or after start date");

        When(x => !x.IsAllDay, () =>
        {
            RuleFor(x => x.StartTime)
                .NotEmpty()
                .WithMessage("Start time is required for partial-day requests")
                .Must(BeValidTime)
                .WithMessage("Start time must be in HH:mm format");

            RuleFor(x => x.EndTime)
                .NotEmpty()
                .WithMessage("End time is required for partial-day requests")
                .Must(BeValidTime)
                .WithMessage("End time must be in HH:mm format");
        });

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .WithMessage("Notes cannot exceed 1000 characters");
    }

    private bool BeValidDate(string? date)
    {
        if (string.IsNullOrEmpty(date))
            return false;

        return DateOnly.TryParseExact(date, "yyyy-MM-dd", out _);
    }

    private bool BeOnOrAfterStartDate(string startDate, string endDate)
    {
        if (!DateOnly.TryParseExact(startDate, "yyyy-MM-dd", out var start))
            return true; // Let other validation handle invalid start date

        if (!DateOnly.TryParseExact(endDate, "yyyy-MM-dd", out var end))
            return true; // Let other validation handle invalid end date

        return end >= start;
    }

    private bool BeValidTime(string? time)
    {
        if (string.IsNullOrEmpty(time))
            return false;

        return TimeOnly.TryParseExact(time, "HH:mm", out _);
    }
}

public class CreateTimeOffTypeValidator : AbstractValidator<CreateTimeOffTypeRequest>
{
    private static readonly Regex ColorRegex = new(@"^#[0-9A-Fa-f]{6}$", RegexOptions.Compiled);

    public CreateTimeOffTypeValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Name is required")
            .Length(2, 100)
            .WithMessage("Name must be between 2 and 100 characters");

        When(x => !string.IsNullOrEmpty(x.Color), () =>
        {
            RuleFor(x => x.Color)
                .Must(BeValidHexColor!)
                .WithMessage("Color must be a valid hex color code (e.g., #4CAF50)");
        });
    }

    private bool BeValidHexColor(string color)
    {
        return ColorRegex.IsMatch(color);
    }
}

public class UpdateTimeOffTypeValidator : AbstractValidator<UpdateTimeOffTypeRequest>
{
    private static readonly Regex ColorRegex = new(@"^#[0-9A-Fa-f]{6}$", RegexOptions.Compiled);

    public UpdateTimeOffTypeValidator()
    {
        When(x => !string.IsNullOrEmpty(x.Name), () =>
        {
            RuleFor(x => x.Name)
                .Length(2, 100)
                .WithMessage("Name must be between 2 and 100 characters");
        });

        When(x => !string.IsNullOrEmpty(x.Color), () =>
        {
            RuleFor(x => x.Color)
                .Must(BeValidHexColor!)
                .WithMessage("Color must be a valid hex color code (e.g., #4CAF50)");
        });
    }

    private bool BeValidHexColor(string color)
    {
        return ColorRegex.IsMatch(color);
    }
}

public class ApproveTimeOffRequestValidator : AbstractValidator<ApproveTimeOffRequest>
{
    public ApproveTimeOffRequestValidator()
    {
        RuleFor(x => x.ApprovalNotes)
            .MaximumLength(1000)
            .WithMessage("Approval notes cannot exceed 1000 characters");
    }
}

public class DenyTimeOffRequestValidator : AbstractValidator<DenyTimeOffRequest>
{
    public DenyTimeOffRequestValidator()
    {
        RuleFor(x => x.ApprovalNotes)
            .MaximumLength(1000)
            .WithMessage("Approval notes cannot exceed 1000 characters");
    }
}
