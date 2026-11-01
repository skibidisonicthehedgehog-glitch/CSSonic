#!/usr/bin/env python3
"""
Build dist/ from sprite sheets YOU downloaded (they are not included in this repo).

  1. Download these 4 sheets from The Spriters Resource (or Sprites Database / SGXP) into ./sheets/ :
       Sega_Genesis_-_Sonic_the_Hedgehog_-_Miscellaneous_-_Credits.png
       Sega_Genesis_-_Sonic_the_Hedgehog_-_Miscellaneous_-_Stage_Title_Cards.png
       Sega_Genesis_-_Sonic_the_Hedgehog_2_-_Miscellaneous_-_Fonts___HUD.png
       Sega_Genesis_-_Sonic_the_Hedgehog_3_-_Miscellaneous_-_Fonts___HUD.png
  2. pip install pillow numpy
  3. python3 tools/build_atlas.py [sheets_dir]

Writes dist/sprites/atlas.png, dist/sonic-text.css, dist/sonic-text.js, dist/manifest.json
"""
import sys, os, io, json
import numpy as np
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=sys.argv[1] if len(sys.argv)>1 else os.path.join(ROOT,'sheets')
P='Sega_Genesis_-_Sonic_the_Hedgehog_'
F1C=P+'-_Miscellaneous_-_Credits.png'; F1T=P+'-_Miscellaneous_-_Stage_Title_Cards.png'
F2=P+'2_-_Miscellaneous_-_Fonts___HUD.png'; F3=P+'3_-_Miscellaneous_-_Fonts___HUD.png'
def teal(a): return (a[...,0]<75)&(a[...,1]>95)&(a[...,2]>105)&(a[...,2]-a[...,1]<70)
def green(a): return (a[...,1]>a[...,0]+35)&(a[...,1]>a[...,2]+35)
def cyan(a): return ((a[...,2]>200)&(a[...,1]>150)&(a[...,0]<90))|((a[...,0]<40)&(a[...,1]>90)&(a[...,1]<150)&(a[...,2]>100)&(a[...,2]<170))
def red(a): return (a[...,0]>100)&(a[...,1]<95)&(a[...,2]<95)
FONTS=[ # id, label, game, sheet, key fn, rows[(box, letters)]
('s1c','Sonic 1 Credits (blue outline)',1,F1C,teal,[((345,892,580,914),'ABCDEFGHI'),((345,918,580,939),'JKLMNOPQR'),((345,943,580,964),'STUVWXYZ2')]),
('s1t','Sonic 1 Title card (white serif)',1,F1T,red,[((770,20,915,43),'ABCDEF'),((770,44,915,66),'GHIKLM'),((770,67,915,88),'NOPRST'),((770,91,840,114),'UYZ')]),
('s2t','Sonic 2 Title card (white)',2,F2,green,[((128,190,395,209),'ABCDEFGHIJKL'),((128,208,395,226),'MNOPQRSTUVWX'),((128,226,395,243),'YZ')]),
('s2m','Sonic 2 Title card (magenta)',2,F2,green,[((128,245,395,263),'ABCDEFGHIJKL'),((128,262,395,280),'MNOPQRSTUVWX'),((128,278,395,296),'YZ')]),
('s2o','Sonic 2 Credits (white outline)',2,F2,green,[((128,97,300,108),'ABCDEFGHIJK'),((128,108,300,117),'LMNOPQRSTUV'),((128,117,300,127),'WXYZ')]),
('s2y','Sonic 2 Credits (yellow outline)',2,F2,green,[((128,126,300,136),'ABCDEFGHIJK'),((128,136,300,145),'LMNOPQRSTUV'),((128,145,300,155),'WXYZ')]),
('s2s','Sonic 2 System (white)',2,F2,green,[((128,31,345,42),'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),((128,41,215,51),'1234567890')]),
('s3c','Sonic 3 Chrome (white)',3,F3,cyan,[((0,389,261,408),'ABCDEFGHIJKLMNO'),((0,407,261,425),'PQRSTUVWXYZ')]),
('s3g','Sonic 3 Chrome (green)',3,F3,cyan,[((0,426,261,446),'ABCDEFGHIJKLMNO'),((0,445,261,464),'PQRSTUVWXYZ')]),
('s3y','Sonic 3 Block (yellow)',3,F3,cyan,[((0,769,261,784),'ABCDEFGHIJKLMNO'),((0,785,261,800),'PQRSTUVWXYZ')]),
]
HEADS={'sonic':(3,119,19,134),'tails':(3,137,19,152),'knuckles':(3,154,19,169)}
BODIES={'sonic':(498,394,526,440),'tails':(527,394,568,440),'knuckles':(569,394,614,440)}
def load(name):
    p=os.path.join(SH,name)
    if not os.path.exists(p): sys.exit('Missing sheet: '+p+'\n(see the instructions at the top of this file)')
    return Image.open(p).convert('RGBA')
def cut(im,key,rows):
    A=np.array(im); A[...,3]=np.where(key(A[...,:3].astype(int)),0,255).astype('uint8'); im=Image.fromarray(A); out={}
    for (x0,y0,x1,y1),ls in rows:
        sub=A[y0:y1,x0:x1,3]>0; cols=sub.any(0); cnt=sub.sum(0); segs=[]; s=None
        for i,c in enumerate(cols):
            if c and s is None: s=i
            if not c and s is not None: segs.append((s,i)); s=None
        if s is not None: segs.append((s,len(cols)))
        segs=[q for q in segs if q[1]-q[0]>=2]
        while len(segs)>len(ls):
            gaps=[segs[i+1][0]-segs[i][1] for i in range(len(segs)-1)]; i=gaps.index(min(gaps)); segs[i:i+2]=[(segs[i][0],segs[i+1][1])]
        while len(segs)<len(ls):
            i=max(range(len(segs)),key=lambda k:segs[k][1]-segs[k][0]); a,b=segs[i]
            m=a+(b-a)//4; n=b-(b-a)//4; c=min(range(m,n+1),key=lambda k:cnt[k]); segs[i:i+1]=[(a,c),(c,b)]
        for (a,b),ch in zip(segs,ls):
            g=im.crop((x0+a,y0,x0+b,y1)); bb=g.getbbox()
            if bb: out[ch]=g.crop(bb)
    return out
items=[];fonts=[];cache={}
for fid,label,game,sheet,key,rows in FONTS:
    cache.setdefault(sheet,load(sheet)); gl=cut(cache[sheet],key,rows)
    fonts.append({'id':fid,'label':label,'game':game,'chars':''.join(sorted(gl))})
    items+= [(f'{fid}-{c}',g) for c,g in sorted(gl.items())]
s2=load(F2); A=np.array(s2); A[...,3]=np.where(green(A[...,:3].astype(int)),0,255).astype('uint8'); s2k=Image.fromarray(A)
EH={}
for n,b in HEADS.items(): g=s2k.crop(b); items.append((f'e-head-{n}',g.crop(g.getbbox())))
for n,b in BODIES.items(): g=s2k.crop(b); g=g.crop(g.getbbox()); items.append((f'e-body-{n}',g)); EH[n]=g.height
items.sort(key=lambda t:-t[1].height); AW=512; x=y=sh=0; pos={}
for id_,im in items:
    if x+im.width+1>AW: x=0;y+=sh+1;sh=0
    pos[id_]=(x,y); x+=im.width+1; sh=max(sh,im.height)
AH=y+sh+1; sheet=Image.new('RGBA',(AW,AH),(0,0,0,0))
for id_,im in items: sheet.paste(im,pos[id_])
os.makedirs(os.path.join(ROOT,'dist/sprites'),exist_ok=True)
sheet.save(os.path.join(ROOT,'dist/sprites/atlas.png'),optimize=True)
css=open(os.path.join(ROOT,'src/base.css')).read()+f'\n.sf-g{{--sf-aw:{AW};--sf-ah:{AH}}}\n'
dim={k:v.size for k,v in items}
for id_,im in items: css+=f'.sf-{id_}{{--x:{pos[id_][0]};--y:{pos[id_][1]};--w:{im.width};--h:{im.height}}}\n'
open(os.path.join(ROOT,'dist/sonic-text.css'),'w').write(css)
js=open(os.path.join(ROOT,'src/engine.js')).read().replace('/*__FONTS__*/[]',json.dumps(fonts,ensure_ascii=False)).replace('/*__EH__*/{}',json.dumps(EH))
open(os.path.join(ROOT,'dist/sonic-text.js'),'w').write(js)
json.dump({'atlas':{'width':AW,'height':AH},'fonts':fonts,'sprites':{k:{'x':v[0],'y':v[1],'w':dim[k][0],'h':dim[k][1]} for k,v in pos.items()}},open(os.path.join(ROOT,'dist/manifest.json'),'w'),indent=1)
print('built atlas',AW,'x',AH,'with',len(items),'sprites')
