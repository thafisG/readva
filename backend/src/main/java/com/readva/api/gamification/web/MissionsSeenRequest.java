package com.readva.api.gamification.web;

import jakarta.validation.constraints.Size;
import java.util.List;

public record MissionsSeenRequest(@Size(max = 100) List<@Size(max = 140) String> keys) {}
