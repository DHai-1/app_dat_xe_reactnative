// Camera padding changes redraw the map but do not select a new address.
export class MapCameraSelection {
  private requested = true;
  private gesture = false;

  request() {
    this.requested = true;
  }

  begin(userInteraction: boolean) {
    if (userInteraction) this.gesture = true;
    return this.requested || this.gesture;
  }

  idle(userInteraction: boolean) {
    if (!this.requested && !this.gesture && !userInteraction) return false;
    this.requested = false;
    this.gesture = false;
    return true;
  }
}
