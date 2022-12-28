package com.github.ruediste.partstrackr.photoUpload;

import org.springframework.stereotype.Component;

@Component
public class PhotoUploadAppController {

	private Long currentPartId;
	private Object lock = new Object();

	public void setCurrentPart(long partId) {
		synchronized (lock) {
			currentPartId = partId;
			lock.notifyAll();
		}
	}

	public Long getCurrentPart(Long partId) {
		synchronized (lock) {
			if (partId != null)
				while (partId == currentPartId) {
					try {
						lock.wait();
					} catch (InterruptedException e) {
						break;
					}
				}
			return currentPartId;
		}
	}

}
