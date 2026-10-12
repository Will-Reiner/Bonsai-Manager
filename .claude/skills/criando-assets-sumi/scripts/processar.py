"""Processa imagens geradas por IA (Gemini/Nano Banana) em peças prontas para o app Nagare.

Subcomandos (rode com --help em cada um):
  icones   folha de ícones em grade (ou um ícone sozinho) -> SVG 24x24 com currentColor
  tinta    tinta sumi sobre papel/branco -> PNG máscara (alfa) na cor da tinta, uma peça por arquivo
  recorte  objetos coloridos sobre fundo branco (folhas, pétalas, vasos) -> PNG com fundo transparente
  papel    foto de papel -> textura repetível sem emenda (JPG)
  revisar  pasta de SVGs -> página HTML de conferência em tamanho real

Dependências: pip install pillow numpy scipy vtracer
"""
import argparse
import html
import os
import re
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage

TINTA = (43, 31, 23)  # #2B1F17


# ---------------------------------------------------------------- utilidades

def cor_de_fundo(arr):
    """Cor do fundo = mediana das bordas da imagem."""
    bordas = np.concatenate([arr[:8].reshape(-1, 3), arr[-8:].reshape(-1, 3), arr[:, :8].reshape(-1, 3), arr[:, -8:].reshape(-1, 3)])
    return np.median(bordas, axis=0)


def componentes(mascara, juntar, minimo):
    """Rotula grupos de pixels; `juntar` dilata antes para unir partes de uma mesma peça."""
    unida = ndimage.binary_dilation(mascara, iterations=juntar) if juntar else mascara
    rotulos, n = ndimage.label(unida)
    caixas = ndimage.find_objects(rotulos)
    pecas = []
    for k, sl in enumerate(caixas, 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h >= minimo and w >= minimo:
            pecas.append((k, sl))
    # ordem de leitura: linhas (com tolerância) e depois colunas
    pecas.sort(key=lambda p: (round(p[1][0].start / max(1, mascara.shape[0] / 12)), p[1][1].start))
    return rotulos, pecas


def salva_png(rgba, caminho, maximo):
    im = Image.fromarray(rgba)
    caixa = im.getbbox()
    if caixa:
        im = im.crop(caixa)
    if maximo and max(im.size) > maximo:
        im.thumbnail((maximo, maximo), Image.LANCZOS)
    im.save(caminho, optimize=True)


# ---------------------------------------------------------------- icones

LADO = 240             # resolução usada para vetorizar (menor = SVG mais leve)
CONTEUDO = 20 / 24     # maior lado do desenho ocupa 20 de 24, como no Lucide


def vetoriza_icone(celula, saida, alvo):
    g = np.asarray(celula.convert("L"), dtype=np.float32)
    tinta = g < 150
    rot, n = ndimage.label(tinta)
    if n == 0:
        raise SystemExit(f"nada desenhado na célula de {saida}")
    tam = ndimage.sum(tinta, rot, range(1, n + 1))
    tinta = np.isin(rot, 1 + np.nonzero(tam >= 40)[0])  # descarta respingos
    ys, xs = np.nonzero(tinta)
    rec = tinta[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = rec.shape
    escala = LADO * CONTEUDO / max(h, w)
    img = Image.fromarray(np.where(rec, 0, 255).astype(np.uint8)).resize((max(1, round(w * escala)), max(1, round(h * escala))), Image.LANCZOS)
    tela = Image.new("L", (LADO, LADO), 255)
    tela.paste(img, ((LADO - img.width) // 2, (LADO - img.height) // 2))
    preto = np.asarray(tela) < 128
    # espessura uniforme: largura média do traço ≈ 2·área/perímetro; só engrossa os finos
    borda = preto & ~ndimage.binary_erosion(preto)
    largura = 2 * preto.sum() / max(borda.sum(), 1)
    if largura < alvo - 1:
        r = int(round((alvo - largura) / 2))
        disco = np.hypot(*np.mgrid[-r:r + 1, -r:r + 1]) <= r + 0.3
        preto = ndimage.binary_dilation(preto, structure=disco)
    tmp = tempfile.mkdtemp()
    p_in, p_out = os.path.join(tmp, "in.png"), os.path.join(tmp, "out.svg")
    Image.fromarray(np.where(preto, 0, 255).astype(np.uint8)).convert("RGB").save(p_in)
    import vtracer
    vtracer.convert_image_to_svg_py(p_in, p_out, colormode="binary", mode="spline", filter_speckle=6,
                                    corner_threshold=60, length_threshold=9.0, splice_threshold=45, path_precision=1)
    paths = re.findall(r"<path[^>]*/>", open(p_out, encoding="utf-8").read())
    corpo = "\n  ".join(re.sub(r'\s*fill="[^"]*"', "", p) for p in paths)
    os.makedirs(os.path.dirname(saida) or ".", exist_ok=True)
    with open(saida, "w", encoding="utf-8") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LADO} {LADO}" width="24" height="24" fill="currentColor">\n  {corpo}\n</svg>\n')
    print(f"{saida}: {os.path.getsize(saida)} bytes (traço medido {largura:.1f}, alvo {alvo})")


def cmd_icones(a):
    im = Image.open(a.imagem).convert("RGB")
    nomes = [n.strip() for n in a.nomes.split(",") if n.strip()]
    if a.grade == "1x1":
        if len(nomes) != 1:
            raise SystemExit("com --grade 1x1 passe um único nome")
        vetoriza_icone(im, os.path.join(a.saida, f"{nomes[0]}{a.sufixo}.svg"), a.alvo)
        return
    cols, rows = (int(v) for v in a.grade.lower().split("x"))
    if len(nomes) != cols * rows:
        raise SystemExit(f"a grade {a.grade} tem {cols * rows} células, mas vieram {len(nomes)} nomes")
    W, H = im.size
    m = 0.03  # margem para não pegar o vizinho
    for k, nome in enumerate(nomes):
        if nome == "-":
            continue  # célula vazia
        c, r = k % cols, k // cols
        cel = im.crop((int((c + m) * W / cols), int((r + m) * H / rows), int((c + 1 - m) * W / cols), int((r + 1 - m) * H / rows)))
        vetoriza_icone(cel, os.path.join(a.saida, f"{nome}{a.sufixo}.svg"), a.alvo)


# ---------------------------------------------------------------- tinta

def cmd_tinta(a):
    im = Image.open(a.imagem).convert("RGB")
    if a.caixa:
        im = im.crop(tuple(int(v) for v in a.caixa.split(",")))
    lum = np.asarray(im.convert("L"), dtype=np.float32)
    papel = np.percentile(lum, 98)
    alfa = np.clip((papel - 8 - lum) / (papel - 8 - 25), 0, 1) ** 0.9
    rotulos, pecas = componentes(alfa > 0.15, a.juntar, a.minimo)
    os.makedirs(a.saida, exist_ok=True)
    for i, (k, sl) in enumerate(pecas, 1):
        al = alfa[sl] * (rotulos[sl] == k)
        rgba = np.zeros((*al.shape, 4), np.uint8)
        rgba[..., :3] = TINTA
        rgba[..., 3] = (al * 255).astype(np.uint8)
        caminho = os.path.join(a.saida, f"{a.prefixo}-{i}.png")
        salva_png(rgba, caminho, a.max)
        print(caminho)


# ---------------------------------------------------------------- recorte

def cmd_recorte(a):
    arr = np.asarray(Image.open(a.imagem).convert("RGB"), dtype=np.float32)
    fundo = cor_de_fundo(arr)
    dist = np.sqrt(((arr - fundo) ** 2).sum(-1))
    rotulos, pecas = componentes(dist > 18, a.juntar, a.minimo)
    os.makedirs(a.saida, exist_ok=True)
    for i, (k, sl) in enumerate(pecas, 1):
        sub, d = arr[sl], dist[sl]
        dono = rotulos[sl] == k
        if a.solido:
            # objeto opaco (vaso): preenche o contorno inteiro, borda suavizada
            cheio = ndimage.binary_fill_holes((d > 30) & dono)
            al = ndimage.gaussian_filter(cheio.astype(np.float32), 1.0)
            rgb = sub
        else:
            # aguada translúcida (folha, pétala): alfa pela distância do fundo e "des-mistura" o branco
            al = np.clip((d - 10) / 60, 0, 1) * dono
            rgb = np.where(al[..., None] > 0.01, (sub - fundo * (1 - al[..., None])) / np.maximum(al[..., None], 0.01), 0)
        rgba = np.dstack([np.clip(rgb, 0, 255), al * 255]).astype(np.uint8)
        caminho = os.path.join(a.saida, f"{a.prefixo}-{i}.png")
        salva_png(rgba, caminho, a.max)
        print(caminho)


# ---------------------------------------------------------------- papel

def cmd_papel(a):
    p = Image.open(a.imagem).convert("RGB")
    lado = min(p.size)
    p = p.crop(((p.width - lado) // 2, (p.height - lado) // 2, (p.width + lado) // 2, (p.height + lado) // 2)).resize((a.tamanho, a.tamanho), Image.LANCZOS)
    t = np.asarray(p, dtype=np.float32)
    N = t.shape[0]
    r = np.arange(N)
    w = np.clip(np.minimum(r, N - 1 - r) / (0.22 * N), 0, 1)
    # perto de cada borda usa a imagem deslocada meio tile, que é contínua na volta
    t = t * w[None, :, None] + np.roll(t, N // 2, 1) * (1 - w[None, :, None])
    t = t * w[:, None, None] + np.roll(t, N // 2, 0) * (1 - w[:, None, None])
    Image.fromarray(t.astype(np.uint8)).save(a.saida, quality=86)
    print(a.saida)


# ---------------------------------------------------------------- revisar

def cmd_revisar(a):
    def svg(p, px):
        return open(p, encoding="utf-8").read().replace('width="24" height="24"', f'width="{px}" height="{px}"')
    blocos = []
    for raiz, _, arquivos in sorted(os.walk(a.pasta)):
        nomes = sorted({f[:-4].removesuffix("-ativo") for f in arquivos if f.endswith(".svg")})
        if not nomes:
            continue
        itens = []
        for n in nomes:
            off = os.path.join(raiz, f"{n}.svg")
            if not os.path.exists(off):
                continue
            on = os.path.join(raiz, f"{n}-ativo.svg")
            extra = f'<span class="r on">{svg(on, 24)}</span>' if os.path.exists(on) else ""
            itens.append(f'<div class="it"><div class="z">{svg(off, 64)}</div><div class="reais"><span class="r off">{svg(off, 24)}</span>{extra}'
                         f'<span class="r mancha"><i></i>{svg(off, 18)}</span></div><div class="nm">{html.escape(n)}</div></div>')
        blocos.append(f'<h3>{html.escape(os.path.relpath(raiz, a.pasta))}</h3><div class="grade">{"".join(itens)}</div>')
    pagina = f'''<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Conferência de ícones</title>
<style>
body {{ margin:0; padding:24px; background:#f4f0e8; color:#2b1f17; font-family:Figtree,system-ui,sans-serif; }}
h1 {{ font:italic 600 28px Newsreader,Georgia,serif; margin:0 0 4px; }} p {{ color:#7a6a5e; margin:0 0 18px; }}
h3 {{ font:italic 600 20px Newsreader,Georgia,serif; margin:18px 0 10px; }}
.grade {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:12px; }}
.it {{ background:rgba(255,255,255,.45); border-radius:12px; padding:10px 8px 8px; text-align:center; }}
.z {{ height:64px; display:flex; justify-content:center; }}
.reais {{ display:flex; justify-content:center; align-items:center; gap:10px; margin-top:8px; }}
.r {{ display:inline-flex; }} .r.off {{ color:#7a6a5e; }} .r.on {{ color:#2b1f17; }}
.r.mancha {{ position:relative; width:36px; height:36px; align-items:center; justify-content:center; color:#f4f0e8; }}
.r.mancha i {{ position:absolute; inset:0; background:#2b1f17; border-radius:48% 52% 50% 46% / 52% 47% 53% 48%; filter:url(#mancha); }}
.r.mancha svg {{ position:relative; }}
.nm {{ font-size:11px; color:#7a6a5e; margin-top:6px; }}
</style></head><body>
<svg width="0" height="0" style="position:absolute"><defs><filter id="mancha"><feTurbulence type="fractalNoise" baseFrequency=".08" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter></defs></svg>
<h1>Conferência de ícones</h1><p>Ampliado em cima; embaixo em tamanho real: inativo, ativo da navegação (se existir) e ativo "mancha de tinta".</p>
{"".join(blocos)}</body></html>'''
    with open(a.saida, "w", encoding="utf-8") as f:
        f.write(pagina)
    print(a.saida)


# ---------------------------------------------------------------- CLI

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("icones", help="grade de ícones -> SVGs 24x24")
    s.add_argument("imagem")
    s.add_argument("--grade", required=True, help="colunas x linhas, ex.: 3x3; 1x1 para um ícone sozinho")
    s.add_argument("--nomes", required=True, help="nomes em ordem de leitura, separados por vírgula ('-' pula célula)")
    s.add_argument("--saida", required=True, help="pasta de saída")
    s.add_argument("--sufixo", default="", help="ex.: -ativo para a versão ativa da navegação")
    s.add_argument("--alvo", type=float, default=14, help="espessura mínima do traço em px de 240 (padrão 14)")
    s.set_defaults(fn=cmd_icones)

    s = sub.add_parser("tinta", help="tinta sumi -> PNGs máscara, uma peça por arquivo")
    s.add_argument("imagem")
    s.add_argument("--saida", required=True)
    s.add_argument("--prefixo", required=True, help="ex.: pincel, enso, bonsai")
    s.add_argument("--caixa", help="recorta antes: x0,y0,x1,y1 em px da imagem original")
    s.add_argument("--juntar", type=int, default=12, help="px de dilatação para unir partes de uma mesma peça")
    s.add_argument("--minimo", type=int, default=60, help="ignora peças menores que isso (px)")
    s.add_argument("--max", type=int, default=1200, help="maior lado do PNG final")
    s.set_defaults(fn=cmd_tinta)

    s = sub.add_parser("recorte", help="objetos coloridos sobre branco -> PNGs transparentes")
    s.add_argument("imagem")
    s.add_argument("--saida", required=True)
    s.add_argument("--prefixo", required=True, help="ex.: folha, petala, vaso")
    s.add_argument("--solido", action="store_true", help="objeto opaco (vaso); sem isso trata como aguada translúcida (folha)")
    s.add_argument("--juntar", type=int, default=6)
    s.add_argument("--minimo", type=int, default=80)
    s.add_argument("--max", type=int, default=600)
    s.set_defaults(fn=cmd_recorte)

    s = sub.add_parser("papel", help="papel -> textura repetível sem emenda")
    s.add_argument("imagem")
    s.add_argument("--saida", required=True, help="arquivo .jpg")
    s.add_argument("--tamanho", type=int, default=768)
    s.set_defaults(fn=cmd_papel)

    s = sub.add_parser("revisar", help="pasta de SVGs -> página de conferência")
    s.add_argument("pasta")
    s.add_argument("--saida", required=True, help="arquivo .html")
    s.set_defaults(fn=cmd_revisar)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
