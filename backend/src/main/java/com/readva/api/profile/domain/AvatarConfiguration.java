package com.readva.api.profile.domain;

import com.readva.api.shared.domain.InvalidRequestException;
import java.util.Set;

public record AvatarConfiguration(
        String skinTone,
        String hairStyle,
        String hairColor,
        String shirtColor,
        String accessory) {
    private static final Set<String> SKIN_TONES = Set.of("light", "warm", "tan", "deep");
    private static final Set<String> HAIR_STYLES = Set.of("short", "curly", "long", "bun");
    private static final Set<String> HAIR_COLORS =
            Set.of("espresso", "chestnut", "golden", "black");
    private static final Set<String> SHIRT_COLORS = Set.of("coffee", "rose", "sage", "blue");
    private static final Set<String> ACCESSORIES =
            Set.of("none", "glasses", "headphones", "earrings");

    public AvatarConfiguration {
        requireSupported(SKIN_TONES, skinTone, "tom de pele");
        requireSupported(HAIR_STYLES, hairStyle, "estilo de cabelo");
        requireSupported(HAIR_COLORS, hairColor, "cor de cabelo");
        requireSupported(SHIRT_COLORS, shirtColor, "cor de roupa");
        requireSupported(ACCESSORIES, accessory, "acessório");
    }

    private static void requireSupported(Set<String> values, String value, String field) {
        if (value == null || !values.contains(value)) {
            throw new InvalidRequestException("O " + field + " do avatar não é válido.");
        }
    }
}
