package com.github.ruediste.partstrackr.parameter;

import java.util.List;
import java.util.stream.Stream;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("api/siPrefix")
@Produces(MediaType.APPLICATION_JSON)
public class SiPrefixRest {

	public static class SiPrefixPMod {
		public String symbol;
		public double multiplier;
		public char character;
		public boolean parseOnly;
	}

	@GET
	public List<SiPrefixPMod> list() {
		return Stream.of(SiPrefix.values()).map(x -> {
			var pMod = new SiPrefixPMod();
			pMod.symbol = x.symbol;
			pMod.character = x.character;
			pMod.multiplier = x.multiplier;
			pMod.parseOnly = x.parseOnly;
			return pMod;
		}).toList();
	}
}
