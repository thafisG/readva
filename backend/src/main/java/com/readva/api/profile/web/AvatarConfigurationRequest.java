package com.readva.api.profile.web;

import com.readva.api.profile.domain.AvatarConfiguration;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AvatarConfigurationRequest(
        @NotBlank @Pattern(regexp = "light|warm|tan|deep") String skinTone,
        @NotBlank @Pattern(regexp = "short|curly|long|bun") String hairStyle,
        @NotBlank @Pattern(regexp = "espresso|chestnut|golden|black") String hairColor,
        @NotBlank @Pattern(regexp = "coffee|rose|sage|blue") String shirtColor,
        @NotBlank @Pattern(regexp = "none|glasses|headphones|earrings") String accessory) {
    AvatarConfiguration toDomain() {
        return new AvatarConfiguration(skinTone, hairStyle, hairColor, shirtColor, accessory);
    }
}
