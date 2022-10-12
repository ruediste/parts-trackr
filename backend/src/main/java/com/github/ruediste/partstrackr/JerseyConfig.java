package com.github.ruediste.partstrackr;

import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.stereotype.Component;

import com.github.ruediste.partstrackr.location.LocationRest;

@Component
public class JerseyConfig extends ResourceConfig {

	public JerseyConfig() {
		register(LocationRest.class);
		register(CORSResponseFilter.class);
	}

}