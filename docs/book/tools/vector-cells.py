"""Project actual Bijou cell captures to outlined SVG and matching vector PDF.

Coordinates, colours and modifiers come from Surface captures. Font selection is
publication presentation only; no component layout is reconstructed here.
"""
from pathlib import Path
import sys,json,html,hashlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import pymupdf

def render_frames(frames, fonts_dir, output, background, foreground):
 fonts={k:TTFont(fonts_dir/f) for k,f in {'regular':'RecursiveMono-Regular.ttf','bold':'RecursiveMono-Bold.ttf','italic':'RecursiveMono-Italic.ttf','fallback':'DejaVuSans.ttf'}.items()}
 output.mkdir(parents=True,exist_ok=True);records=[]
 for frame in frames:
  existing=output/f'{frame["id"]}.pdf'
  svg_path=output/f'{frame["id"]}.svg'
  if existing.exists() and svg_path.exists() and hashlib.sha256(json.dumps(frame,sort_keys=True,separators=(',',':')).encode()).hexdigest() in svg_path.read_text():
   records.append({k:v for k,v in frame.items() if k!='cells'}|{'cell_sha256':hashlib.sha256(json.dumps(frame,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'svg_sha256':hashlib.sha256(svg_path.read_bytes()).hexdigest(),'font':'Recursive Mono, MONO=1, CASL=0; DejaVu Sans symbols'});continue
  defs={};glyphs=[];backgrounds=[];decor=[];cw,ch=10,20;pad=8;width=frame['width']*cw+pad*2;height=frame['height']*ch+pad*2
  for cell in frame['cells']:
   x,y=pad+cell['x']*cw,pad+cell['y']*ch;fg,bg=cell.get('fg') or foreground,cell.get('bg') or background;mods=cell.get('modifiers') or []
   if 'inverse' in mods:fg,bg=bg,fg
   alpha=cell.get('opacity',1)
   if not cell.get('empty',False) and bg!=background:backgrounds.append(f'<rect x="{x}" y="{y}" width="{cw}" height="{ch}" fill="{bg}" opacity="{alpha}"/>')
   if 'hidden' in mods:continue
   if 'dim' in mods:alpha*=0.6
   for char in cell['char']:
    if char.isspace() or ord(char) in [0xfe0e,0xfe0f]:continue
    face='bold' if 'bold' in mods else 'italic' if 'italic' in mods else 'regular'
    if ord(char) not in fonts[face].getBestCmap():face='fallback'
    font=fonts[face];name=font.getBestCmap().get(ord(char))
    if name is None:raise RuntimeError(f'Missing glyph {char!r} in {frame["id"]}')
    key=(face,ord(char))
    if key not in defs:
     pen=SVGPathPen(font.getGlyphSet());font.getGlyphSet()[name].draw(pen);defs[key]=(f'g{len(defs)}',pen.getCommands())
    gid=defs[key][0];scale=(cw/.6)/font['head'].unitsPerEm
    glyphs.append(f'<use href="#{gid}" transform="translate({x},{y+15.4}) scale({scale:.8f},{-scale:.8f})" fill="{fg}" opacity="{alpha}" data-cell="{cell["x"]},{cell["y"]}"/>')
   for mod,dy in [('underline',18),('strikethrough',10)]:
    if mod in mods:decor.append(f'<path d="M{x} {y+dy}h{cw}" stroke="{fg}" stroke-width="0.8" opacity="{alpha}"/>')
  sha=hashlib.sha256(json.dumps(frame,sort_keys=True,separators=(',',':')).encode()).hexdigest();title=html.escape(frame['title']);desc=html.escape(f'Actual Bijou Surface capture, {frame["width"]} columns by {frame["height"]} rows. Recursive Mono (MONO=1, CASL=0) outlines; DejaVu Sans symbol fallback. Exact cells, colours and modifiers. Cell SHA-256 {sha}.')
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc"><title id="title">{title}</title><desc id="desc">{desc}</desc><defs>'+''.join(f'<path id="{gid}" d="{d}"/>' for gid,d in defs.values())+f'</defs><rect width="{width}" height="{height}" fill="{background}"/>'+''.join(backgrounds+glyphs+decor)+'</svg>\n'
  (output/f'{frame["id"]}.svg').write_text(svg)
  doc=pymupdf.open(stream=svg.encode(),filetype='svg');pdf=pymupdf.open('pdf',doc.convert_to_pdf())
  # Add a spatially aligned invisible text layer: the visible projection remains
  # exact glyph outlines, while words in tables stay searchable and copyable.
  page=pdf[0];scale_pdf=page.rect.width/width
  for face,font in fonts.items():page.insert_font(fontname='capture'+face,fontfile=str(fonts_dir/({'regular':'RecursiveMono-Regular.ttf','bold':'RecursiveMono-Bold.ttf','italic':'RecursiveMono-Italic.ttf','fallback':'DejaVuSans.ttf'}[face])))
  for y in range(frame['height']):
   row=[c for c in frame['cells'] if c['y']==y];runs=[];run='';start=0;face_prev=None
   for cell in row+[{'x':frame['width'],'char':'','modifiers':[]}]:
    char=cell['char'];face='bold' if 'bold' in (cell.get('modifiers') or []) else 'regular'
    if any(ord(c) not in fonts[face].getBestCmap() for c in char):face='fallback'
    if face!=face_prev or not char:
     if run.strip():page.insert_text(((pad+start*cw)*scale_pdf,(pad+y*ch+15.4)*scale_pdf),run,fontname='capture'+face_prev,fontsize=(cw/.6)*scale_pdf,render_mode=3)
     run='';start=cell['x'];face_prev=face
    run+=char
  pdf.subset_fonts();pdf.save(output/f'{frame["id"]}.pdf',garbage=4,deflate=True);pdf.close();doc.close()
  records.append({k:v for k,v in frame.items() if k!='cells'}|{'cell_sha256':sha,'svg_sha256':hashlib.sha256(svg.encode()).hexdigest(),'font':'Recursive Mono, MONO=1, CASL=0; DejaVu Sans symbols'})
 return records
if __name__=='__main__':
 source,fonts,out,bg,fg=sys.argv[1:];frames=json.loads(Path(source).read_text());records=render_frames(frames,Path(fonts),Path(out),bg,fg);Path(out,'manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'frames':len(records),'out':out}))
