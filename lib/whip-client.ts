/** WHIP (WebRTC HTTP Ingest Protocol) publisher for MediaMTX */
export class WHIPClient {
  private pc: RTCPeerConnection | null = null
  private stream: MediaStream | null = null

  async start(stream: MediaStream, endpoint: string): Promise<void> {
    this.stream = stream
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    for (const track of stream.getTracks()) {
      this.pc.addTrack(track, stream)
    }

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
    if (!res.ok) throw new Error(`WHIP failed: ${res.status}`)

    const sdp = await res.text()
    await this.pc.setRemoteDescription({ type: 'answer', sdp })
  }

  stop(): void {
    this.stream?.getTracks().forEach(t => t.stop())
    this.pc?.close()
    this.pc = null
    this.stream = null
  }
}
