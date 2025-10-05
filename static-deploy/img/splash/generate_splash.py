#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_splash_screen(width, height, filename):
    """创建启动画面"""
    # 创建黑色背景
    img = Image.new('RGB', (width, height), color='#000000')
    draw = ImageDraw.Draw(img)

    # 计算文字位置（中心偏下）
    text = "Loading..."

    # 使用系统字体
    try:
        # 尝试使用较大的字体
        font_size = int(height * 0.04)  # 4%的屏幕高度
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()

    # 获取文字边界框
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # 文字位置（中心偏下）
    text_x = (width - text_width) // 2
    text_y = int(height * 0.55)  # 55%位置

    # 绘制文字（灰色）
    draw.text((text_x, text_y), text, fill='#888888', font=font)

    # 绘制三个点的加载动画
    dot_size = int(height * 0.015)  # 1.5%的屏幕高度
    dot_spacing = int(height * 0.025)  # 2.5%的间距

    dots_y = text_y + text_height + int(height * 0.03)
    dots_start_x = width // 2 - dot_spacing

    for i in range(3):
        x = dots_start_x + i * dot_spacing
        draw.rectangle(
            [x, dots_y, x + dot_size, dots_y + dot_size],
            outline='#666666',
            width=2
        )

    # 保存图片
    img.save(filename, 'PNG', optimize=True)
    print(f"Created: {filename} ({width}x{height})")

# iPhone 17 Pro 规格
# 物理分辨率: 2622 x 1206 (实际是横向的，但iOS会按设备方向调整)
# 逻辑分辨率: 874 x 402 @ 3x
# 竖屏启动画面应该是: 1206 x 2622

# 创建iPhone 17 Pro的启动画面
create_splash_screen(1206, 2622, 'iphone-17-pro-portrait.png')
create_splash_screen(2622, 1206, 'iphone-17-pro-landscape.png')

print("\n启动画面生成完成！")
