# macOS software preview of retained production cell captures; no third-party modules.
import ctypes as C,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
CF=C.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
CG=C.CDLL('/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics')
CT=C.CDLL('/System/Library/Frameworks/CoreText.framework/CoreText')
IO=C.CDLL('/System/Library/Frameworks/ImageIO.framework/ImageIO')
P=C.c_void_p; D=C.c_double; U=C.c_size_t
class Point(C.Structure):_fields_=[('x',D),('y',D)]
class Size(C.Structure):_fields_=[('w',D),('h',D)]
class Rect(C.Structure):_fields_=[('origin',Point),('size',Size)]
def bind(lib,name,args,result=P):
 f=getattr(lib,name);f.argtypes=args;f.restype=result;return f
string=bind(CF,'CFStringCreateWithCString',[P,C.c_char_p,C.c_uint32])
release=bind(CF,'CFRelease',[P],None)
dictionary=bind(CF,'CFDictionaryCreateMutable',[P,C.c_long,P,P])
setvalue=bind(CF,'CFDictionarySetValue',[P,P,P],None)
fontfn=bind(CT,'CTFontCreateWithName',[P,D,P])
attrfn=bind(CF,'CFAttributedStringCreate',[P,P,P])
linefn=bind(CT,'CTLineCreateWithAttributedString',[P])
draw=bind(CT,'CTLineDraw',[P,P],None)
colorSpace=bind(CG,'CGColorSpaceCreateDeviceRGB',[])
context=bind(CG,'CGBitmapContextCreate',[P,U,U,U,U,P,C.c_uint32])
fill=bind(CG,'CGContextSetRGBFillColor',[P,D,D,D,D],None)
rectangle=bind(CG,'CGContextFillRect',[P,Rect],None)
position=bind(CG,'CGContextSetTextPosition',[P,D,D],None)
imagefn=bind(CG,'CGBitmapContextCreateImage',[P])
urlfn=bind(CF,'CFURLCreateFromFileSystemRepresentation',[P,C.c_char_p,C.c_long,C.c_bool])
destfn=bind(IO,'CGImageDestinationCreateWithURL',[P,P,U,P])
addimage=bind(IO,'CGImageDestinationAddImage',[P,P,P],None)
finish=bind(IO,'CGImageDestinationFinalize',[P],C.c_bool)
fontname=string(None,b'Menlo',0x08000100);font=fontfn(fontname,15,None)
attrs=dictionary(None,0,None,None)
setvalue(attrs,P.in_dll(CT,'kCTFontAttributeName').value,font)
setvalue(attrs,P.in_dll(CT,'kCTForegroundColorFromContextAttributeName').value,P.in_dll(CF,'kCFBooleanTrue').value)
lines={}
def line(char):
 if char not in lines:
  s=string(None,char.encode(),0x08000100);a=attrfn(None,s,attrs)
  lines[char]=linefn(a);release(a);release(s)
 return lines[char]
def rgb(value):
 value=value.lstrip('#');return tuple(int(value[i:i+2],16)/255 for i in [0,2,4])
data=json.loads((ROOT/'scenes.json').read_text())
for frame in data['frames']:
 if not frame['cells']:continue
 assert frame['mode'] in ('dark','light') and frame['timeMs'] in (0,350)
 assert frame['width']==120 and frame['height']==40
 w=frame['width']*9;h=frame['height']*18
 assert w*h<2_000_000 and len(frame['cells'])==frame['width']*frame['height']
 buffer=C.create_string_buffer(w*h*4);space=colorSpace();ctx=context(buffer,w,h,8,w*4,space,16385)
 assert ctx
 for i,(char,fg,bg) in enumerate(frame['cells']):
  x=(i%frame['width'])*9;y=h-(i//frame['width']+1)*18
  fill(ctx,*rgb(bg or '#ffffff'),1);rectangle(ctx,Rect(Point(x,y),Size(9,18)))
  if char not in [' ','\u2800']:
   fill(ctx,*rgb(fg or '#000000'),1);position(ctx,x,y+4);draw(line(char),ctx)
 path=ROOT/f"book-{frame['mode']}-{frame['timeMs']}.png"
 url=urlfn(None,str(path).encode(),len(str(path).encode()),False);kind=string(None,b'public.png',0x08000100)
 dest=destfn(url,kind,1,None);image=imagefn(ctx);addimage(dest,image,None)
 assert finish(dest)
 for obj in [dest,image,url,kind,ctx,space]:release(obj)
 print(path)
for obj in list(lines.values())+[attrs,font,fontname]:release(obj)
