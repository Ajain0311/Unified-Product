using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SuperApp.API.Models;

public class AppSetting
{
    [Key]
    public int Id { get; set; }
    
    [Required, MaxLength(100)]
    public string SettingKey { get; set; } = string.Empty;
    
    [Column(TypeName = "text")]
    public string? SettingValue { get; set; }
    
    [MaxLength(255)]
    public string? Description { get; set; }
    
    public DateTime? UpdatedAt { get; set; }
}
