// ─── PDF render yardımcıları — Buffer döner ────────────────────────────────
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { HakedisPdf, SozlesmePdf, FaturaPdf } from './documents'
import { TeklifPdf } from './TeklifPdf'
import { KanitPaketiPdf } from './KanitPaketiPdf'

export async function renderHakedisPdf(data: any): Promise<Buffer> {
    return await renderToBuffer(<HakedisPdf data={data} />)
}

export async function renderSozlesmePdf(data: any): Promise<Buffer> {
    return await renderToBuffer(<SozlesmePdf data={data} />)
}

export async function renderFaturaPdf(data: any): Promise<Buffer> {
    return await renderToBuffer(<FaturaPdf data={data} />)
}

export async function renderTeklifPdf(data: any): Promise<Buffer> {
    return await renderToBuffer(<TeklifPdf data={data} />)
}

export async function renderKanitPaketiPdf(data: any): Promise<Buffer> {
    return await renderToBuffer(<KanitPaketiPdf data={data} />)
}
