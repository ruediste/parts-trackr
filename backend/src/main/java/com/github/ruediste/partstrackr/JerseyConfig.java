package com.github.ruediste.partstrackr;

import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.stereotype.Component;

import com.github.ruediste.partstrackr.document.DocumentRest;
import com.github.ruediste.partstrackr.inventory.InventoryEntryRest;
import com.github.ruediste.partstrackr.location.LocationRest;
import com.github.ruediste.partstrackr.parameter.SiPrefixRest;
import com.github.ruediste.partstrackr.part.BrowseRest;
import com.github.ruediste.partstrackr.part.PartRest;
import com.github.ruediste.partstrackr.photoUpload.PhotoUploadRest;

@Component
public class JerseyConfig extends ResourceConfig {

	public JerseyConfig() {
		register(LocationRest.class);
		register(PartRest.class);
		register(BrowseRest.class);
		register(DocumentRest.class);
		register(PhotoUploadRest.class);
		register(SiPrefixRest.class);
		register(InventoryEntryRest.class);
		register(CORSResponseFilter.class);
	}

}