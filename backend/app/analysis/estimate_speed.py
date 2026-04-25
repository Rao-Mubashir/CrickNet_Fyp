from pathlib import Path


def parse_coords(filename):
    coords = []
    with open(filename, "r") as f:
        for line in f:
            parts = line.strip().split(",")
            if len(parts) == 3:
                frame, x, y = int(parts[0]), float(parts[1]), float(parts[2])
                coords.append((frame, x, y))
    return coords


def find_bounce(coords):
    """
    Detect the bounce point as the first local maximum in Y.
    """
    for i in range(1, len(coords) - 2):
        y_prev = coords[i - 1][2]
        y_curr = coords[i][2]
        y_next = coords[i + 1][2]
        y_after = coords[i + 2][2]

        if y_curr > y_prev and y_curr > y_next:
            return coords[i][0], i

        if y_curr > y_prev and y_curr == y_next and y_next > y_after:
            return coords[i][0], i

    return None, None


def estimate_average_speed(coords, bounce_index, fps, pitch_length_m=16.0):
    start_frame = coords[0][0]
    bounce_frame = coords[bounce_index][0]
    frames_taken = bounce_frame - start_frame

    if frames_taken <= 0:
        return None

    time_taken = frames_taken / fps
    speed_mps = pitch_length_m / time_taken
    speed_kmh = speed_mps * 3.6
    return time_taken, speed_mps, speed_kmh


def main():
    import sys
    if len(sys.argv) < 2:
        print("Usage: python estimate_speed.py <input_coords.txt>")
        sys.exit(1)
        
    coords_file = sys.argv[1]

    coords = parse_coords(coords_file)
    if len(coords) < 4:
        print(f"Not enough coordinates to estimate speed: found {len(coords)} points")
        return

    fps = 30
    pitch_length_m = 16.0

    bounce_frame, bounce_index = find_bounce(coords)
    if bounce_frame is None:
        print("Bounce not detected. Check whether the ball trajectory contains a clear local maximum in Y.")
        return

    result = estimate_average_speed(coords, bounce_index, fps, pitch_length_m)
    if result is None:
        print("Could not estimate speed from the available coordinates.")
        return

    time_taken, speed_mps, speed_kmh = result

    print(f"Estimated bowling speed over {pitch_length_m:.1f} m pitch")
    print(f"Start frame: {coords[0][0]}")
    print(f"Bounce frame: {bounce_frame}")
    print(f"Time to bounce: {time_taken:.3f} s")
    print(f"Average speed: {speed_mps:.2f} m/s")
    print(f"Average speed: {speed_kmh:.2f} km/h")
    print()
    print("Note: this assumes the first detected ball frame is close to the release point and the bounce occurs on the 16 m delivery path.")


if __name__ == "__main__":
    main()