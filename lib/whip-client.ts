/** WHIP (WebRTC HTTP Ingest Protocol) publisher for MediaMTX */
export class WHIPClient {
  private pc: RTCPeerConnection | null = null
  private stream: MediaStream | null = null

  async start(stream: MediaStream, endpoint: string): Promise<void> {
    this.stream = stream
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    // Use sendonly transceivers — WHIP requires a=sendonly in SDP
    for (const track of stream.getTracks()) {
      this.pc.addTransceiver(track, { direction: 'sendonly', streams: [stream] })
    }

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    // Wait for ICE gathering to complete (max 5s)
    await new Promise<void>(resolve => {
      if (this.pc!.iceGatheringState === 'complete') { resolve(); return }
      const timer = setTimeout(resolve, 5000)
      this.pc!.addEventListener('icegatheringstatechange', () => {
        if (this.pc!.iceGatheringState === 'complete') {
          clearTimeout(timer)
          resolve()
        }
      })
    })

    const sdp = this.pc.localDescription?.sdp
    if (!sdp) throw new Error('SDP not available after ICE gathering')

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: sdp,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`WHIP ${res.status}: ${body || res.statusText}`)
    }

    const answerSdp = await res.text()
    await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
  }

  stop(): void {
    this.stream?.getTracks().forEach(t => t.stop())
    this.pc?.close()
    this.pc = null
    this.stream = null
  }
}
