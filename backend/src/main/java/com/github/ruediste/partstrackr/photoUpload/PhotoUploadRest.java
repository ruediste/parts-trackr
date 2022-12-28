package com.github.ruediste.partstrackr.photoUpload;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
@Path("api/photo")
@Produces(MediaType.APPLICATION_JSON)
public class PhotoUploadRest {

	@Autowired
	PhotoUploadService service;

	@Autowired
	PhotoUploadAppController ctrl;

	@GET
	@Path("qrCode")
	public Response getQrCode() {
		InetAddress addr = null;
		try {
			var interfaces = NetworkInterface.getNetworkInterfaces();
			while (addr == null && interfaces.hasMoreElements()) {
				var ifa = interfaces.nextElement();
				if (ifa.getName().startsWith("br-"))
					continue;
				if (ifa.getName().startsWith("veth"))
					continue;
				if (ifa.getName().startsWith("docker"))
					continue;
				if (ifa.getName().equals("lo"))
					continue;
				var addrs = ifa.getInetAddresses();
				while (addrs.hasMoreElements()) {
					addr = addrs.nextElement();
					break;
				}
			}
		} catch (SocketException e) {
			throw new RuntimeException(e);
		}

		if (addr == null) {
			throw new RuntimeException("No IP Address found");
		}
		var url = "http://" + addr.getHostAddress() + ":3000/photo";
		System.out.println("Server URL: " + url);
		StreamingOutput stream = new StreamingOutput() {
			@Override
			public void write(OutputStream os) throws IOException, WebApplicationException {
				service.generateQrCode(url, 256, os);
			}
		};
		return Response.ok(stream).header("Content-Type", "image/png").build();
	}

	@GET
	@Path("currentPart")
	public Long getCurrentPart(@QueryParam("part") Long partId) {
		return ctrl.getCurrentPart(partId);
	}

	@POST
	@Path("currentPart")
	public void setCurrentPart(@QueryParam("part") long partId) {
		ctrl.setCurrentPart(partId);
	}
}
