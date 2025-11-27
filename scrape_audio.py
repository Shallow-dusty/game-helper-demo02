import requests
from bs4 import BeautifulSoup
import os
import time
import re

# 配置
BASE_URL = "https://www.soundjay.com"
OUTPUT_DIR = "downloaded_audio"
# 想要爬取的类别页面
CATEGORIES = [
    {"url": "https://www.soundjay.com/ambient-sounds.html", "name": "ambient"},
    {"url": "https://www.soundjay.com/nature-sounds.html", "name": "nature"},
    # {"url": "https://www.soundjay.com/clock-sound-effect.html", "name": "clock"}, # 404 Not Found
    {"url": "https://www.soundjay.com/magic-sound-effect.html", "name": "magic"},
]

def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

def download_file(url, filepath, max_retries=3, backoff=2):
    """下载音频，验证 Content-Type 并在临时错误时重试"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    temp_path = f"{filepath}.part"

    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(url, headers=headers, stream=True, timeout=30)
            response.raise_for_status()

            content_type = response.headers.get('Content-Type', '').lower()
            if not content_type.startswith('audio/') and not url.lower().endswith('.mp3'):
                raise ValueError(f"非音频资源(Content-Type={content_type or 'unknown'})")

            with open(temp_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            os.replace(temp_path, filepath)
            print(f"✅ 已下载: {filepath}")
            return True
        except (requests.HTTPError, requests.ConnectionError, requests.Timeout, ValueError) as e:
            should_retry = isinstance(e, (requests.HTTPError, requests.ConnectionError, requests.Timeout)) and attempt < max_retries
            print(f"❌ 下载失败 {url} (尝试 {attempt}/{max_retries}): {e}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            if should_retry:
                sleep_time = backoff ** (attempt - 1)
                print(f"⏳ {sleep_time}s 后重试...")
                time.sleep(sleep_time)
            else:
                return False

    return False

def scrape_category(category):
    print(f"\n🔍 正在扫描类别: {category['name']} ({category['url']})...")
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(category['url'], headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # SoundJay 通常在 <audio> 标签或链接中提供 mp3
        # 查找所有 mp3 链接
        audio_links = []
        
        # 策略1: 查找 href 结尾是 .mp3 的 a 标签
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href.endswith('.mp3'):
                full_url = href if href.startswith('http') else f"{BASE_URL}/{href}"
                # 获取描述文本
                desc = a.get_text(strip=True)
                if not desc:
                    # 尝试找前一个兄弟节点的文本
                    prev = a.find_previous('div')
                    if prev:
                        desc = prev.get_text(strip=True)
                
                audio_links.append({'url': full_url, 'desc': desc or 'unknown'})

        # 去重
        unique_links = {v['url']: v for v in audio_links}.values()
        
        print(f"📊 找到 {len(unique_links)} 个音频文件")
        
        category_dir = os.path.join(OUTPUT_DIR, category['name'])
        ensure_dir(category_dir)
        
        for item in unique_links:
            url = item['url']
            filename = url.split('/')[-1]
            filepath = os.path.join(category_dir, filename)
            
            if os.path.exists(filepath):
                print(f"⏭️ 跳过已存在: {filename}")
                continue
                
            print(f"⬇️ 正在下载: {filename}...")
            download_file(url, filepath)
            time.sleep(1) # 礼貌爬取，避免请求过快
            
    except Exception as e:
        print(f"❌ 处理类别 {category['name']} 时出错: {e}")

def main():
    print("🎵 开始爬取 SoundJay 音频资源...")
    ensure_dir(OUTPUT_DIR)
    
    for cat in CATEGORIES:
        scrape_category(cat)
        
    print("\n✨ 所有任务完成！音频已保存在 downloaded_audio 目录中。")
    print("💡 提示: 你可以将下载的音频上传到 CDN 或项目 public 目录，并在 constants.ts 中更新 URL。")

if __name__ == "__main__":
    main()
