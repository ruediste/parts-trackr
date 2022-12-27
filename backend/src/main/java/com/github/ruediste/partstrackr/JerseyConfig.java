package com.github.ruediste.partstrackr;

import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.stereotype.Component;

import com.github.ruediste.partstrackr.document.DocumentRest;
import com.github.ruediste.partstrackr.inventory.InventoryItemRest;
import com.github.ruediste.partstrackr.location.LocationRest;
import com.github.ruediste.partstrackr.parameter.SiPrefixRest;
import com.github.ruediste.partstrackr.part.PartRest;

@Component
public class JerseyConfig extends ResourceConfig {

	public JerseyConfig() {
		register(LocationRest.class);
		register(PartRest.class);
		register(DocumentRest.class);
		register(SiPrefixRest.class);
		register(InventoryItemRest.class);
		register(CORSResponseFilter.class);
	}

}