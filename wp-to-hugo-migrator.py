#!/usr/bin/env python3
"""
WordPress to Hugo Migration Script
Migre un export XML WordPress vers Hugo avec organisation des images par année
Version corrigée avec gestion robuste des images
"""

import xml.etree.ElementTree as ET
import os
import re
import unicodedata
import urllib.parse
import requests
from datetime import datetime
import argparse
import ssl
import hashlib
import time
from urllib3.exceptions import InsecureRequestWarning

# Désactiver les avertissements SSL
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

class WordPressToHugo:
    def __init__(self, xml_file, output_dir=".", download_images=True):
        self.xml_file = xml_file
        self.output_dir = output_dir
        self.download_images = download_images
        self.content_dir = os.path.join(output_dir, "content", "posts")
        self.images_dir = os.path.join(output_dir, "static", "images")
        
        # Statistiques
        self.downloaded_images = 0
        self.failed_images = 0
        
        # Créer les dossiers nécessaires
        os.makedirs(self.content_dir, exist_ok=True)
        os.makedirs(self.images_dir, exist_ok=True)
        
    def slugify(self, text):
        """Convertit un texte en slug URL-friendly"""
        # Normalise les caractères unicode
        text = unicodedata.normalize('NFKD', text)
        text = text.encode('ascii', 'ignore').decode('ascii')
        
        # Convertit en minuscules et remplace les espaces/caractères spéciaux
        text = re.sub(r'[^\w\s-]', '', text.lower())
        text = re.sub(r'[-\s]+', '-', text)
        
        return text.strip('-')
    
    def clean_filename(self, filename):
        """Nettoie un nom de fichier pour éviter les problèmes d'encodage"""
        # Remplacer les caractères problématiques
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        
        # Si le filename contient des caractères non-ASCII, créer un nom alternatif
        try:
            filename.encode('ascii')
            return filename
        except UnicodeEncodeError:
            # Créer un nom de fichier basé sur un hash
            base, ext = os.path.splitext(filename)
            hash_name = hashlib.md5(filename.encode('utf-8')).hexdigest()[:8]
            return f"image_{hash_name}{ext}"
    
    def download_image(self, url, year, original_filename):
        """Télécharge une image et la place dans le bon dossier par année"""
        try:
            year_dir = os.path.join(self.images_dir, str(year))
            os.makedirs(year_dir, exist_ok=True)
            
            # Nettoyer le nom de fichier
            clean_filename = self.clean_filename(original_filename)
            filepath = os.path.join(year_dir, clean_filename)
            
            # Évite de retélécharger si le fichier existe
            if os.path.exists(filepath):
                return f"/images/{year}/{clean_filename}"
            
            # Configuration de la session requests avec gestion SSL
            session = requests.Session()
            session.verify = False  # Désactiver la vérification SSL
            
            # Headers pour éviter les blocages
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            # Encoder l'URL correctement
            try:
                # Parser l'URL
                parsed = urllib.parse.urlparse(url)
                
                # Encoder le path en gardant les caractères de structure
                encoded_path = urllib.parse.quote(parsed.path.encode('utf-8'), safe='/')
                
                # Reconstruire l'URL
                encoded_url = urllib.parse.urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    encoded_path,
                    parsed.params,
                    parsed.query,
                    parsed.fragment
                ))
                
            except Exception as e:
                print(f"Erreur encodage URL {url}: {e}")
                encoded_url = url
            
            # Télécharger l'image
            print(f"Téléchargement: {encoded_url}")
            response = session.get(
                encoded_url, 
                headers=headers, 
                timeout=30,
                stream=True
            )
            response.raise_for_status()
            
            # Vérifier que c'est bien une image
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                print(f"⚠️  Pas une image: {content_type} pour {url}")
                self.failed_images += 1
                return url
            
            # Sauvegarder l'image
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            print(f"✓ Image téléchargée: {filepath}")
            self.downloaded_images += 1
            return f"/images/{year}/{clean_filename}"
            
        except requests.exceptions.SSLError as e:
            print(f"❌ Erreur SSL {url}: {e}")
            self.failed_images += 1
            return url
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur téléchargement {url}: {e}")
            self.failed_images += 1
            return url
            
        except UnicodeEncodeError as e:
            print(f"❌ Erreur encodage {url}: {e}")
            self.failed_images += 1
            return url
            
        except Exception as e:
            print(f"❌ Erreur générale {url}: {e}")
            self.failed_images += 1
            return url
    
    def process_content(self, content, post_date):
        """Traite le contenu et télécharge les images"""
        if not content:
            return ""
        
        year = post_date.year
        
        # Regex pour trouver les images dans le contenu
        img_pattern = r'<img[^>]*src=["\']([^"\']*)["\'][^>]*>'
        
        def replace_image(match):
            img_tag = match.group(0)
            img_url = match.group(1)
            
            if self.download_images and img_url.startswith('http'):
                # Extrait le nom de fichier de l'URL
                try:
                    parsed_url = urllib.parse.urlparse(img_url)
                    filename = os.path.basename(parsed_url.path)
                    
                    if filename:
                        # Ajouter une extension si manquante
                        if not os.path.splitext(filename)[1]:
                            filename += '.jpg'
                        
                        local_path = self.download_image(img_url, year, filename)
                        return img_tag.replace(img_url, local_path)
                    
                except Exception as e:
                    print(f"Erreur traitement URL image {img_url}: {e}")
            
            return img_tag
        
        # Remplace les images
        content = re.sub(img_pattern, replace_image, content, flags=re.IGNORECASE)
        
        # Traiter aussi les liens directs vers des images (souvent dans WordPress)
        link_img_pattern = r'<a[^>]*href=["\']([^"\']*\.(jpg|jpeg|png|gif|webp))["\'][^>]*>'
        
        def replace_image_link(match):
            link_tag = match.group(0)
            img_url = match.group(1)
            
            if self.download_images and img_url.startswith('http'):
                try:
                    parsed_url = urllib.parse.urlparse(img_url)
                    filename = os.path.basename(parsed_url.path)
                    
                    if filename:
                        local_path = self.download_image(img_url, year, filename)
                        return link_tag.replace(img_url, local_path)
                        
                except Exception as e:
                    print(f"Erreur traitement lien image {img_url}: {e}")
            
            return link_tag
        
        content = re.sub(link_img_pattern, replace_image_link, content, flags=re.IGNORECASE)
        
        # Nettoie le HTML pour Markdown
        content = self.html_to_markdown(content)
        
        return content
    
    def html_to_markdown(self, html):
        """Conversion basique HTML vers Markdown"""
        if not html:
            return ""
        
        # Remplacements basiques
        replacements = [
            (r'<h1[^>]*>(.*?)</h1>', r'# \1'),
            (r'<h2[^>]*>(.*?)</h2>', r'## \1'),
            (r'<h3[^>]*>(.*?)</h3>', r'### \1'),
            (r'<h4[^>]*>(.*?)</h4>', r'#### \1'),
            (r'<h5[^>]*>(.*?)</h5>', r'##### \1'),
            (r'<h6[^>]*>(.*?)</h6>', r'###### \1'),
            (r'<strong[^>]*>(.*?)</strong>', r'**\1**'),
            (r'<b[^>]*>(.*?)</b>', r'**\1**'),
            (r'<em[^>]*>(.*?)</em>', r'*\1*'),
            (r'<i[^>]*>(.*?)</i>', r'*\1*'),
            (r'<a[^>]*href=["\']([^"\']*)["\'][^>]*>(.*?)</a>', r'[\2](\1)'),
            (r'<br[^>]*/?>', '\n'),
            (r'<p[^>]*>', '\n'),
            (r'</p>', '\n'),
            (r'<div[^>]*>', ''),
            (r'</div>', ''),
            (r'<span[^>]*>', ''),
            (r'</span>', ''),
            (r'<ul[^>]*>', ''),
            (r'</ul>', ''),
            (r'<ol[^>]*>', ''),
            (r'</ol>', ''),
            (r'<li[^>]*>', '- '),
            (r'</li>', ''),
            (r'<blockquote[^>]*>', '\n> '),
            (r'</blockquote>', '\n'),
        ]
        
        for pattern, replacement in replacements:
            html = re.sub(pattern, replacement, html, flags=re.IGNORECASE | re.DOTALL)
        
        # Nettoie les balises HTML restantes
        html = re.sub(r'<[^>]+>', '', html)
        
        # Nettoie les lignes vides multiples
        html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)
        
        # Décode les entités HTML
        import html as html_module
        html = html_module.unescape(html)
        
        return html.strip()
    
    def extract_categories_tags(self, item):
        """Extrait les catégories et tags d'un article"""
        categories = []
        tags = []
        
        for category in item.findall('.//category'):
            domain = category.get('domain', '')
            nicename = category.get('nicename', '')
            text = category.text or ''
            
            if domain == 'category' and text:
                categories.append(text)
            elif domain == 'post_tag' and text:
                tags.append(text)
        
        return categories, tags
    
    def migrate_posts(self):
        """Migre tous les articles WordPress vers Hugo"""
        tree = ET.parse(self.xml_file)
        root = tree.getroot()
        
        # Namespace WordPress
        ns = {'wp': 'http://wordpress.org/export/1.2/'}
        
        posts_count = 0
        
        for item in root.findall('.//item'):
            # Vérifie que c'est un post publié
            post_type = item.find('wp:post_type', ns)
            post_status = item.find('wp:status', ns)
            
            if (post_type is not None and post_type.text == 'post' and
                post_status is not None and post_status.text == 'publish'):
                
                title = item.find('title').text or 'Sans titre'
                pub_date = item.find('pubDate').text
                content = item.find('content:encoded', {'content': 'http://purl.org/rss/1.0/modules/content/'})
                content = content.text if content is not None else ''
                
                # Parse la date
                try:
                    post_date = datetime.strptime(pub_date, '%a, %d %b %Y %H:%M:%S %z')
                except ValueError:
                    # Essayer un autre format si le premier échoue
                    try:
                        post_date = datetime.strptime(pub_date, '%a, %d %b %Y %H:%M:%S %Z')
                    except ValueError:
                        print(f"⚠️  Format de date non reconnu pour {title}: {pub_date}")
                        post_date = datetime.now()
                
                # Extrait catégories et tags
                categories, tags = self.extract_categories_tags(item)
                
                # Crée le slug
                slug = self.slugify(title)
                if not slug:
                    slug = f"post-{posts_count + 1}"
                
                # Traite le contenu et les images
                processed_content = self.process_content(content, post_date)
                
                # Crée le front matter
                escaped_title = title.replace('"', '\\"')
                categories_yaml = chr(10).join(f'  - "{cat}"' for cat in categories) if categories else '  []'
                tags_yaml = chr(10).join(f'  - "{tag}"' for tag in tags) if tags else '  []'
                
                front_matter = f"""---
title: "{escaped_title}"
author: "Poitiers Collectif"
date: "{post_date.strftime('%Y-%m-%dT%H:%M:%S')}"
lastmod: "{post_date.strftime('%Y-%m-%dT%H:%M:%S')}"
slug: "{slug}"
categories:
{categories_yaml}
tags:
{tags_yaml}
draft: false
---

"""
                
                # Crée le dossier par année
                year_dir = os.path.join(self.content_dir, str(post_date.year))
                os.makedirs(year_dir, exist_ok=True)
                
                # Nom du fichier
                filename = f"{slug}.md"
                filepath = os.path.join(year_dir, filename)
                
                # Évite les doublons
                counter = 1
                while os.path.exists(filepath):
                    filename = f"{slug}-{counter}.md"
                    filepath = os.path.join(year_dir, filename)
                    counter += 1
                
                # Écrit le fichier
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(front_matter + processed_content)
                
                posts_count += 1
                print(f"Article migré: {title} -> {filepath}")
                
                # Petite pause pour éviter de surcharger les serveurs
                if self.download_images:
                    time.sleep(0.1)
        
        print(f"\nMigration terminée: {posts_count} articles migrés")
        print(f"Images téléchargées: {self.downloaded_images}")
        print(f"Images échouées: {self.failed_images}")
        return posts_count

def main():
    parser = argparse.ArgumentParser(description='Migre WordPress vers Hugo')
    parser.add_argument('xml_file', help='Fichier XML d\'export WordPress')
    parser.add_argument('--output', '-o', default='.', help='Dossier de sortie (défaut: .)')
    parser.add_argument('--no-images', action='store_true', help='Ne pas télécharger les images')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.xml_file):
        print(f"Erreur: Le fichier {args.xml_file} n'existe pas")
        return 1
    
    migrator = WordPressToHugo(
        xml_file=args.xml_file,
        output_dir=args.output,
        download_images=not args.no_images
    )
    
    try:
        migrator.migrate_posts()
        print("\nMigration réussie!")
        print(f"Articles: content/posts/YYYY/")
        print(f"Images: static/images/YYYY/")
        
    except Exception as e:
        print(f"Erreur lors de la migration: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())