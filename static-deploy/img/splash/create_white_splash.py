#!/usr/bin/env python3
"""
创建一个纯白色的启动画面用于对比测试
如果使用白色启动画面就看不到闪白屏，说明问题确实是启动画面和HTML之间的gap
"""
from PIL import Image

# 创建纯白色启动画面
def create_white_splash(width, height, filename):
    img = Image.new('RGB', (width, height), color='#FFFFFF')
    img.save(filename, 'PNG')
    print(f"Created white splash: {filename} ({width}x{height})")

# iPhone 17 Pro
create_white_splash(1206, 2304, 'white-splash-portrait.png')
create_white_splash(2304, 1206, 'white-splash-landscape.png')

print("\n白色启动画面已创建！")
print("将这些文件上传后，创建一个使用白色启动画面的测试页面。")
print("如果使用白色启动画面就看不到闪烁，证明问题是启动画面消失时机。")
