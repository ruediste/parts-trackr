package com.github.ruediste.partstrackr.parameter;

public enum Unit {
	VOLT("V"), AMPERE("A"), WATT("W"), METER("m"), WATT_HOURS("Wh"), AMPERE_HOURS("Ah"), OHM("Ohm"), FARAD("F"),
	HENRY("H");

	public final String symbol;

	private Unit(String symbol) {
		this.symbol = symbol;

	}
}
