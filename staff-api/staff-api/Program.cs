using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FluentValidation;
using staff_application.Interfaces;
using staff_application.Services;
using staff_application.Validators;
using staff_infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "StyleMate Staff Management API",
        Version = "v1",
        Description = "Staff, invitation, and permission management API for StyleMate application"
    });

    // Add JWT Bearer Authentication
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Register SoftDeleteInterceptor as singleton
builder.Services.AddSingleton<SoftDeleteInterceptor>();

// Database Configuration with soft delete interceptor
builder.Services.AddDbContext<StaffManagementContext>((serviceProvider, options) =>
{
    var interceptor = serviceProvider.GetRequiredService<SoftDeleteInterceptor>();
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.MigrationsHistoryTable("__EFMigrationsHistory_StaffManagement"))
    .AddInterceptors(interceptor)
    .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// JWT Authentication Configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            ValidAudience = builder.Configuration["JWT:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:SecretKey"]!))
        };
    });

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// FluentValidation - register all validators from application assembly (manual validation pattern)
builder.Services.AddValidatorsFromAssemblyContaining<CreateStaffMemberValidator>();

// Dependency Injection - Application Services
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IInvitationService, InvitationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();

var app = builder.Build();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<StaffManagementContext>();
    context.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
