package com.github.ruediste.partstrackr.parameter;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

public class SiPrefixTest {

	@Test
	public void testGet() {
		assertEquals(SiPrefix.KILO, SiPrefix.get(2.2e3));
		assertEquals(null, SiPrefix.get(100));
		assertEquals(SiPrefix.MILLI, SiPrefix.get(0.12));
		assertEquals(SiPrefix.MICRO, SiPrefix.get(10e-6));
	}
}
