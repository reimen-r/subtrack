import zlib
import struct
import math
import os

def create_png(width, height, get_pixel, filename):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0: None
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            # clamp to 0-255
            r = max(0, min(255, int(r)))
            g = max(0, min(255, int(g)))
            b = max(0, min(255, int(b)))
            a = max(0, min(255, int(a)))
            raw_data.extend([r, g, b, a])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))  # 8-bit RGBA
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    
    with open(filename, 'wb') as f:
        f.write(png)
    print(f'Successfully generated {filename} ({width}x{height})')

def render_icon_pixel(x, y, w, h, is_maskable=False):
    # Normalized coordinates -1.0 to 1.0
    nx = (x / (w - 1)) * 2.0 - 1.0
    ny = (y / (h - 1)) * 2.0 - 1.0
    
    # Scale if maskable to provide safe zone
    scale = 0.72 if is_maskable else 0.88
    sx = nx / scale
    sy = ny / scale
    
    # Rounded rectangle bounds for non-maskable
    if not is_maskable:
        # Corner radius check
        corner_r = 0.45
        dx = max(0.0, abs(nx) - (1.0 - corner_r))
        dy = max(0.0, abs(ny) - (1.0 - corner_r))
        dist_corner = math.sqrt(dx * dx + dy * dy)
        if dist_corner > corner_r:
            return 0, 0, 0, 0  # transparent outside rounded corner
    
    # Base background: Deep sleek dark with subtle diagonal gradient
    t_diag = (nx + ny + 2.0) / 4.0
    bg_r = 9 + t_diag * 10
    bg_g = 9 + t_diag * 12
    bg_b = 11 + t_diag * 18
    
    # Ambient radial glow in center
    dist_center = math.sqrt(sx * sx + sy * sy)
    glow_intensity = max(0.0, 1.0 - dist_center / 1.1)
    # Indigo & emerald ambient tint
    bg_r += glow_intensity * 25
    bg_g += glow_intensity * 35
    bg_b += glow_intensity * 65

    # 1. Card element: placed at center top: sy between -0.45 and 0.15, sx between -0.65 and 0.65
    card_w = 0.62
    card_h = 0.36
    card_cy = -0.15
    cdx = abs(sx) - card_w
    cdy = abs(sy - card_cy) - card_h
    c_corner = 0.08
    c_dist = math.sqrt(max(0.0, cdx + c_corner)**2 + max(0.0, cdy + c_corner)**2)
    in_card = cdx <= 0 and cdy <= 0 or (cdx <= c_corner and cdy <= c_corner and c_dist <= c_corner)

    if in_card:
        # Card gradient: Deep slate/indigo
        card_t = (sx / card_w + (sy - card_cy) / card_h + 2.0) / 4.0
        cr = 28 + card_t * 22
        cg = 25 + card_t * 30
        cb = 75 + card_t * 60
        
        # Golden chip at top left
        chip_cx = -0.38
        chip_cy = -0.22
        chip_w = 0.11
        chip_h = 0.08
        if abs(sx - chip_cx) <= chip_w and abs(sy - chip_cy) <= chip_h:
            return 245, 175, 45, 255
            
        # Subtle horizontal stripes on card
        if -0.08 <= (sy - card_cy) <= -0.05 and sx >= -0.38 and sx <= 0.2:
            return 120, 130, 240, 230
        if 0.02 <= (sy - card_cy) <= 0.04 and sx >= -0.38 and sx <= 0.05:
            return 100, 110, 220, 180

        # Card brand logo circles at top-right
        if math.sqrt((sx - 0.42)**2 + (sy - card_cy + 0.12)**2) <= 0.075:
            return 16, 185, 129, 240  # Emerald circle
        if math.sqrt((sx - 0.49)**2 + (sy - card_cy + 0.12)**2) <= 0.075:
            return 99, 102, 241, 240  # Indigo circle

        bg_r = cr
        bg_g = cg
        bg_b = cb

    # 2. Central Recurring Renewal Loop Badge: Center at (0.0, 0.25)
    badge_cy = 0.25
    bdx = sx
    bdy = sy - badge_cy
    b_dist = math.sqrt(bdx * bdx + bdy * bdy)
    
    # Outer badge ring
    if b_dist <= 0.38:
        # Ring border with gradient (Indigo to Emerald)
        if 0.34 <= b_dist <= 0.38:
            ring_angle = math.atan2(bdy, bdx)
            t_ring = (math.sin(ring_angle) + 1.0) / 2.0
            rr = 99 * (1.0 - t_ring) + 16 * t_ring
            rg = 102 * (1.0 - t_ring) + 185 * t_ring
            rb = 241 * (1.0 - t_ring) + 129 * t_ring
            return rr, rg, rb, 255
        elif b_dist < 0.34:
            # Badge inner background
            bg_r = 14
            bg_g = 15
            bg_b = 22
            
            # Renewal circular arc arrows
            arc_r = 0.21
            arc_thick = 0.04
            diff = abs(b_dist - arc_r)
            
            angle = math.atan2(bdy, bdx) # -pi to pi
            # Top arc: angle between -0.2 and 2.9 (indigo)
            if diff <= arc_thick:
                if 0.1 <= angle <= 2.8:
                    return 99, 102, 241, 255
                elif -2.8 <= angle <= -0.1:
                    return 16, 185, 129, 255

            # Arrow tips
            # Top-right arrow tip around angle ~0.1, r ~0.21
            if math.sqrt((bdx - 0.21)**2 + (bdy - 0.02)**2) <= 0.055:
                return 99, 102, 241, 255
            # Bottom-left arrow tip around angle ~ -3.0, r ~0.21
            if math.sqrt((bdx + 0.21)**2 + (bdy + 0.02)**2) <= 0.055:
                return 16, 185, 129, 255

            # Central glowing core point
            if b_dist <= 0.065:
                return 56, 189, 248, 255

    # Corner highlight / sparkle at top-right
    sp_x = sx - 0.65
    sp_y = sy + 0.65
    sp_dist = math.sqrt(sp_x * sp_x + sp_y * sp_y)
    if sp_dist < 0.1:
        # Cross star shape
        star = max(0.0, 1.0 - (abs(sp_x) * abs(sp_y) * 120.0 + sp_dist * 4.0))
        if star > 0.1:
            bg_r += star * 150
            bg_g += star * 200
            bg_b += star * 255

    return bg_r, bg_g, bg_b, 255

def main():
    os.makedirs('public', exist_ok=True)
    
    # 1. 192x192 PNG
    create_png(192, 192, lambda x, y, w, h: render_icon_pixel(x, y, w, h, False), 'public/pwa-192x192.png')
    
    # 2. 512x512 PNG
    create_png(512, 512, lambda x, y, w, h: render_icon_pixel(x, y, w, h, False), 'public/pwa-512x512.png')
    
    # 3. 512x512 Maskable PNG
    create_png(512, 512, lambda x, y, w, h: render_icon_pixel(x, y, w, h, True), 'public/pwa-maskable-512x512.png')
    
    # 4. 180x180 Apple Touch Icon PNG
    create_png(180, 180, lambda x, y, w, h: render_icon_pixel(x, y, w, h, False), 'public/apple-touch-icon.png')
    
    # 5. Favicon 48x48 PNG (named favicon.ico for browser fallback compatibility)
    create_png(48, 48, lambda x, y, w, h: render_icon_pixel(x, y, w, h, False), 'public/favicon.ico')

if __name__ == '__main__':
    main()
