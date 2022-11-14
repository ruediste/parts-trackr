package com.github.ruediste.partstrackr.parameter;

public enum SiPrefix {
	TERA("T", 1e12), GIGA("G", 1e9), MEGA("M", 1e6), KILO("k", 1e3), MILLI("m", 1e-3), MICRO("\u03bc", 'u', 1e-6),
	NANO("n", 1e-9), PICO("p", 1e-12);

	public final String symbol;
	public final double multiplier;
	public final char character;

	private SiPrefix(String symbol, double multiplier) {
		this(symbol, symbol.charAt(0), multiplier);
	}

	private SiPrefix(String symbol, char character, double multiplier) {
		this.symbol = symbol;
		this.character = character;
		this.multiplier = multiplier;
	}

	public static SiPrefix get(double value) {
		if (value >= 1 && value < KILO.multiplier)
			return null;

		for (SiPrefix p : values()) {
			if (p.multiplier <= value) {
				return p;
			}
		}
		return null;
	}
}
