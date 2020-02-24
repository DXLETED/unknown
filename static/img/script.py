import requests
from bs4 import BeautifulSoup as BS

r = requests.get('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/')
html = BS(r.content, 'html.parser')

for el in html.select('tr > td > a:not(a[href="../"]):not(a[href="uncentered/"])'):
  file = el.get('title')
  img = requests.get('{folder}{file}/{file}000.jpg'.format(folder='https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/', file=file))
  if r.status_code == 200:
    with open('champion-splashes/{file}.jpg'.format(file=file), "wb") as f:
      f.write(img.content)