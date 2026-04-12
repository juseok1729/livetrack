/** WHEP (WebRTC HTTP Egress Protocol) subscriber for MediaMTX */
export class WHEPClient {
  private pc: RTCPeerConnection | null = null

  async start(endpoint: string): Promise<MediaStream> {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    this.pc.addTransceiver('video', { direction: 'recvonly' })
    this.pc.addTransceiver('audio', { direction: 'recvonly' })

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    // Wait for ICE gathering (max 4s)
    await new Promise<void>(resolve => {
      if (this.pc!.iceGatheringState === 'complete') { resolve(); return }
      const timer = setTimeout(resolve, 4000)
      this.pc!.addEventListener('icegatheringstatechange', () => {
        if (this.pc!.iceGatheringState === 'complete') {
          clearTimeout(timer)
          resolve()
        }
      })
    })

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: this.pc.localDescription?.sdp,
    })
    if (!res.ok) throw new Error(`WHEP failed: ${res.status}`)

    const sdp = await res.text()
    await this.pc.setRemoteDescription({ type: 'answer', sdp })

    return new Promise((resolve, reject) => {
      const stream = new MediaStream()
      const timeout = setTimeout(() => reject(new Error('Track timeout')), 10000)
      this.pc!.addEventListener('track', e => {
        stream.addTrack(e.track)
        if (stream.getVideoTracks().length > 0) {
          clearTimeout(timeout)
          resolve(stream)
        }
      })
    })
  }

  stop(): void {
    this.pc?.close()
    this.pc = null
  }
}
