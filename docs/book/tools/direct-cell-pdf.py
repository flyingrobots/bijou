"""Render the same cell geometry as vector-cells.py using reusable PDF fonts."""
from pathlib import Path
import sys,json,hashlib
import pymupdf
from fontTools.ttLib import TTFont

def rgb(color):return tuple(int(color[i:i+2],16)/255 for i in [1,3,5])
def render(frames,fontdir,out,bg,fg):
 paths={k:fontdir/f for k,f in {'regular':'RecursiveMono-Regular.ttf','bold':'RecursiveMono-Bold.ttf','italic':'RecursiveMono-Italic.ttf','fallback':'DejaVuSans.ttf'}.items()}
 maps={k:TTFont(p).getBestCmap() for k,p in paths.items()};fonts={k:pymupdf.Font(fontfile=str(p)) for k,p in paths.items()};out.mkdir(exist_ok=True,parents=True);metadata=[]
 for f in frames:
  width=f['width']*10+16;height=f['height']*20+16;doc=pymupdf.open();page=doc.new_page(width=width,height=height);page.draw_rect(page.rect,color=None,fill=rgb(bg));groups={};decor=[]
  # Draw all backgrounds before foregrounds, matching the SVG projection order.
  for c in f['cells']:
   x,y=8+c['x']*10,8+c['y']*20;color,back=c.get('fg') or fg,c.get('bg') or bg;mods=c.get('modifiers') or [];alpha=c.get('opacity',1)
   if 'inverse' in mods:color,back=back,color
   if not c.get('empty',False) and back!=bg:page.draw_rect(pymupdf.Rect(x,y,x+10,y+20),color=None,fill=rgb(back),fill_opacity=alpha,overlay=True)
   if 'hidden' in mods:continue
   if 'dim' in mods:alpha*=0.6
   for ch in c['char']:
    if ch.isspace() or ord(ch) in [0xfe0e,0xfe0f]:continue
    face='bold' if 'bold' in mods else 'italic' if 'italic' in mods else 'regular'
    if ord(ch) not in maps[face]:face='fallback'
    if ord(ch) not in maps[face]:raise RuntimeError((f['id'],ch))
    key=(color,alpha);writer=groups.setdefault(key,pymupdf.TextWriter(page.rect));writer.append((x,y+15.4),ch,font=fonts[face],fontsize=10/.6)
   for mod,dy in [('underline',18),('strikethrough',10)]:
    if mod in mods:decor.append((x,y+dy,color,alpha))
  for (color,alpha),writer in groups.items():writer.write_text(page,color=rgb(color),opacity=alpha)
  for x,y,color,alpha in decor:page.draw_line((x,y),(x+10,y),color=rgb(color),width=.8,stroke_opacity=alpha)
  doc.subset_fonts();path=out/(f['id']+'.pdf');doc.save(path,garbage=4,deflate=True);doc.close();metadata.append({'id':f['id'],'pdf_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size})
 (out/'pdf-manifest.json').write_text(json.dumps(metadata,indent=2)+'\n');print(json.dumps({'frames':len(frames),'bytes':sum(r['bytes'] for r in metadata)}))
if __name__=='__main__':
 source,fonts,out,bg,fg=sys.argv[1:];render(json.loads(Path(source).read_text()),Path(fonts),Path(out),bg,fg)
