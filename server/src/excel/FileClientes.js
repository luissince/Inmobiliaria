const xl = require('excel4node');
const { formatMoney, dateFormat, numberFormat } = require('../tools/Tools');

async function generateExcelCliente(req, sedeInfo, data, condicion) {
    try {
        const wb = new xl.Workbook();

        let ws = wb.addWorksheet('Hoja 1');

        const styleTitle = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                color: '#000000',
                size: 12,
            },
        });

        const styleTitleDetalle = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                color: '#000000',
                size: 12,
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: '#FDCCA2',
                fgColor: '#FDCCA2',
            },
        });

        const styleTitleVenta = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                bold: true,
                color: '#000000',
                size: 12,
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: '#FF973E',
                fgColor: '#FF973E',
            },
        });

        const styleNoContent = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                color: '#000000',
                size: 12,
            },
        });

        const styleHeader = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            }
        });

        const styleTableHeader = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                bold: true,
                color: '#000000',
                size: 12,
            },
        });

        const styleTableHeaderDetalle = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                bold: true,
                color: '#000000',
                size: 12,
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: '#FCE2CC',
                fgColor: '#FCE2CC',
            },
        });

        const styleTableHeaderVenta = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                bold: true,
                color: '#000000',
                size: 12,
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: '#FEB474',
                fgColor: '#FEB474',
            },
        });

        const styleBody = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            }
        });

        const styleBodyInteger = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            }
        });

        const styleBodyFloat = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            },
            numberFormat: '#,##0.00; (#,##0.00); 0',
        });

        if (condicion == 0) {

            ws.column(1).setWidth(10);
            ws.column(2).setWidth(20);
            ws.column(3).setWidth(40);
            ws.column(4).setWidth(20);
            ws.column(5).setWidth(10);
            ws.column(6).setWidth(10);
            ws.column(7).setWidth(15);
            ws.column(8).setWidth(15);
            ws.column(9).setWidth(20);

            ws.cell(1, 1, 1, 9, true).string(`${sedeInfo.nombreEmpresa}`).style(styleTitle);
            ws.cell(2, 1, 2, 9, true).string(`RUC: ${sedeInfo.ruc}`).style(styleTitle);
            ws.cell(3, 1, 3, 9, true).string(`${sedeInfo.direccion}`).style(styleTitle);
            ws.cell(4, 1, 4, 9, true).string(`Celular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`).style(styleTitle);

            ws.cell(6, 1, 6, 9, true).string(`REPORTE DE CLIENTES`).style(styleTitle);
            ws.cell(7, 1, 7, 9, true).string(`PERIODO: ${dateFormat(req.query.fechaIni)} al ${dateFormat(req.query.fechaFin)}`).style(styleTitle);

            ws.cell(9, 1).string(`CLIENTE:`).style(styleHeader);
            ws.cell(9, 2).string(`${req.query.idCliente === "" ? "TODOS" : req.query.cliente}`).style(styleHeader);

            const header = ["N°", "Documento", "Cliente", "Manzana", "Lote", "Ctas.", "Cta. Mensual", "Cta. Total", "Tipo Cta."];
            header.map((item, index) => ws.cell(11, 1 + index).string(item).style(styleTableHeader));

            let rowY = 11;

            if (data.length === 0) {
                rowY = rowY + 1;
                ws.cell(rowY, 1, rowY, 9, true).string("No existe datos relacionados").style(styleNoContent)
            } else {
                data.map((item, index) => {
                    rowY = rowY + 1;

                    ws.cell(rowY, 1).number(1 + index).style(styleBodyInteger)
                    ws.cell(rowY, 2).string(item.nameDocument + " : " + item.documento).style(styleBody)
                    ws.cell(rowY, 3).string(item.informacion).style(styleBody)
                    ws.cell(rowY, 4).string(item.nameManzana).style(styleBody)
                    ws.cell(rowY, 5).string(item.nameLote).style(styleBody)
                    ws.cell(rowY, 6).number(item.cuoTotal).style(styleBody)
                    ws.cell(rowY, 7).number(parseFloat(formatMoney(item.cuotaMensual))).style(styleBodyFloat)
                    ws.cell(rowY, 8).number(parseFloat(formatMoney(item.precio))).style(styleBodyFloat)
                    ws.cell(rowY, 9).string(item.frecuenciaName).style(styleBody)
                });
            }

            return wb.writeToBuffer();

        } else {

            ws.column(1).setWidth(10);
            ws.column(2).setWidth(20);
            ws.column(3).setWidth(40);
            ws.column(4).setWidth(20);
            ws.column(5).setWidth(10);
            ws.column(6).setWidth(10);
            ws.column(7).setWidth(15);
            ws.column(8).setWidth(15);
            ws.column(9).setWidth(20);

            ws.cell(1, 1, 1, 9, true).string(`${sedeInfo.nombreEmpresa}`).style(styleTitle);
            ws.cell(2, 1, 2, 9, true).string(`RUC: ${sedeInfo.ruc}`).style(styleTitle);
            ws.cell(3, 1, 3, 9, true).string(`${sedeInfo.direccion}`).style(styleTitle);
            ws.cell(4, 1, 4, 9, true).string(`Celular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`).style(styleTitle);

            ws.cell(6, 1, 6, 6, true).string(`LISTA DE APORTACIONES`).style(styleTitle);
            ws.cell(7, 1, 7, 9, true).string(`PERIODO: ${dateFormat(req.query.fechaIni)} al ${dateFormat(req.query.fechaFin)}`).style(styleTitle);

            ws.cell(9, 1).string(`CLIENTE:`).style(styleHeader);
            ws.cell(9, 2).string(`${req.query.idCliente === "" ? "TODOS" : req.query.cliente}`).style(styleHeader);

            if (data.length === 0) {
                const header = ["N°", "Documento", "Cliente", "Manzana", "Lote", "Ctas.", "Cta. Mensual", "Cta. Total", "Tipo Cta."];
                header.map((item, index) => ws.cell(12, 1 + index).string(item).style(styleTableHeader));

                let rowY = 12;
                rowY = rowY + 1;

                ws.cell(rowY, 1, rowY, 9, true).string("No existe datos relacionados").style(styleNoContent)
            } else {

                let rowY = 11;
                // rowY = rowY + 1;
                let i = 0;
                while (i < data.length) {

                    ws.cell(rowY, 1, rowY, 9, true).string(`VENTA N° ` + (i + 1)).style(styleTitleVenta);

                    rowY = rowY + 1;

                    const header = ["N°", "Documento", "Cliente", "Manzana", "Lote", "Ctas.", "Cta. Mensual", "Cta. Total", "Tipo Cta."];
                    header.map((item, index) => ws.cell(rowY, 1 + index).string(item).style(styleTableHeaderVenta));

                    rowY = rowY + 1;

                    ws.cell(rowY, 1).number(i + 1).style(styleBodyInteger)
                    ws.cell(rowY, 2).string(data[i].nameDocument + " : " + data[i].documento).style(styleBody)
                    ws.cell(rowY, 3).string(data[i].informacion).style(styleBody)
                    ws.cell(rowY, 4).string(data[i].nameManzana).style(styleBody)
                    ws.cell(rowY, 5).string(data[i].nameLote).style(styleBody)
                    ws.cell(rowY, 6).number(data[i].cuoTotal).style(styleBody)
                    ws.cell(rowY, 7).number(parseFloat(formatMoney(data[i].cuotaMensual))).style(styleBodyFloat)
                    ws.cell(rowY, 8).number(parseFloat(formatMoney(data[i].precio))).style(styleBodyFloat)
                    ws.cell(rowY, 9).string(data[i].frecuenciaName).style(styleBody)

                    rowY = rowY + 2;

                    ws.cell(rowY, 1, rowY, 9, true).string("DETALLE DE LA VENTA N° " + (i + 1)).style(styleTitleDetalle)

                    rowY = rowY + 1;
                    const headerDetalle = ["N°", "Fecha", "Comprobante", "Detalle", "Banco", "Comprobante Ref.", "Monto"];
                    headerDetalle.map((item, index) =>
                        index == 4 ? ws.cell(rowY, 1 + index, rowY, index + 2, true).string(item).style(styleTableHeaderDetalle)
                            : index == 5 ? ws.cell(rowY, 2 + index, rowY, index + 3, true).string(item).style(styleTableHeaderDetalle)
                                : index > 5 ? ws.cell(rowY, 3 + index).string(item).style(styleTableHeaderDetalle)
                                    : ws.cell(rowY, 1 + index).string(item).style(styleTableHeaderDetalle)
                    );

                    if (data[i].detail.length === 0) {
                        rowY = rowY + 1;
                        ws.cell(rowY, 1, rowY, 8, true).string("No existe datos relacionados").style(styleNoContent)
                    } else {


                        data[i].detail.map((item, index) => {
                            rowY = rowY + 1;

                            ws.cell(rowY, 1).string(i + 1 + "." + (1 + index)).style(styleBodyInteger)
                            ws.cell(rowY, 2).string(item.fecha).style(styleBody)
                            ws.cell(rowY, 3).string(item.comprobante + " : " + item.serie + '-' + item.numeracion).style(styleBody)
                            ws.cell(rowY, 4).string(item.detalle).style(styleBody)
                            ws.cell(rowY, 5, rowY, 6, true).string(item.banco).style(styleBody)
                            ws.cell(rowY, 7, rowY, 8, true).string(item.comprobanteRef).style(styleBody)
                            ws.cell(rowY, 9).number(parseFloat(formatMoney(item.monto))).style(styleBodyFloat)
                        });

                        rowY = rowY + 3;
                    }
                    i++;
                }

            }

            return wb.writeToBuffer();

        }

    } catch (error) {
        return "Error en generar el excel.";
    }
}

async function generateExcelDeudas(req, sedeInfo, data) {
    try {

        const wb = new xl.Workbook();

        let ws = wb.addWorksheet('Hoja 1');

        const styleTitle = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                color: '#000000',
                size: 12,
            },
        });

        const styleHeader = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            }
        });

        const styleTableHeader = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                bold: true,
                color: '#000000',
                size: 12,
            },

        });

        const styleBody = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            }
        });

        const styleBodyInteger = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            }
        });

        const styleBodyFloat = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            },
            numberFormat: '#,##0.00; (#,##0.00); 0',
        });

        ws.column(1).setWidth(10);
        ws.column(2).setWidth(20);
        ws.column(3).setWidth(25);
        ws.column(4).setWidth(20);
        ws.column(5).setWidth(20);
        ws.column(6).setWidth(20);
        ws.column(7).setWidth(20);
        ws.column(8).setWidth(20);
        ws.column(9).setWidth(20);
        ws.column(10).setWidth(20);

        ws.cell(1, 1, 1, 10, true).string(`${sedeInfo.nombreEmpresa}`).style(styleTitle);
        ws.cell(2, 1, 2, 10, true).string(`RUC: ${sedeInfo.ruc}`).style(styleTitle);
        ws.cell(3, 1, 3, 10, true).string(`${sedeInfo.direccion}`).style(styleTitle);
        ws.cell(4, 1, 4, 10, true).string(`Celular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`).style(styleTitle);

        ws.cell(6, 1, 6, 10, true).string(`LISTA DE DEUDAS POR CLIENTE`).style(styleTitle);

        const header = ["N°", "Cliente", "Propiedad", "Comprobante", "Cuota Mensual", "Cuotas Pendientes", "Sig. Pago", "Total", "Cobrado", "Por Cobrar"];
        header.map((item, index) => ws.cell(8, 1 + index).string(item).style(styleTableHeader));

        let rowY = 8;

        data.map((item, index) => {
            rowY = rowY + 1;

            ws.cell(rowY, 1).number(1 + index).style(styleBodyInteger)
            ws.cell(rowY, 2).string(item.documento + "\n" + item.informacion).style(styleBody)
            ws.cell(rowY, 3).string(item.lote).style(styleBody)
            ws.cell(rowY, 4).string(item.nombre + "\n" + item.serie + "-" + item.numeracion).style(styleBody)
            ws.cell(rowY, 5).number(parseFloat(formatMoney(item.cuotaMensual))).style(styleBodyFloat)
            ws.cell(rowY, 6).string(item.numCuota == 1 ? item.numCuota + " CUOTA" : item.numCuota + " CUOTAS").style(styleBody)
            ws.cell(rowY, 7).string(dateFormat(item.fechaPago)).style(styleBody)

            ws.cell(rowY, 8).number(parseFloat(formatMoney(item.total))).style(styleBodyFloat)
            ws.cell(rowY, 9).number(parseFloat(formatMoney(item.cobrado))).style(styleBodyFloat)
            ws.cell(rowY, 10).number(parseFloat(formatMoney(item.total - item.cobrado))).style(styleBodyFloat)
        });
        rowY = rowY + 1;

        return wb.writeToBuffer();
    } catch (error) {
        return "Error en generar el excel.";
    }
}

async function generarSociosPorFecha(req, sedeInfo, data) {
    try {
        const wb = new xl.Workbook();

        let ws = wb.addWorksheet('Hoja 1');

        const styleTitle = wb.createStyle({
            alignment: {
                horizontal: 'center'
            },
            font: {
                color: '#000000',
                size: 12,
            },
        });

        const styleSubTitle = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 10,
            },
        });

        const styleTableHeader = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                bold: true,
                color: '#000000',
                size: 12,
            },

        });

        const styleBody = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            }
        });

        const styleBodyInteger = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            }
        });

        const styleBodyFloat = wb.createStyle({
            alignment: {
                horizontal: 'left'
            },
            font: {
                color: '#000000',
                size: 12,
            },
            numberFormat: '#,##0.00; (#,##0.00); 0',
        });

        const fillSocio = {
            fill: {
                type: 'pattern',
                patternType: 'solid',
                fgColor: '#c7c7ff',
            }
        }

        const fillVenta = {
            font: {
                bold: true,
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                fgColor: '#e6e6e6',
            }
        }

        const textSize = {
            font: {
                size: 10
            },
        }

        ws.column(1).setWidth(20);
        ws.column(2).setWidth(20);
        ws.column(3).setWidth(30);
        ws.column(4).setWidth(40);
        ws.column(5).setWidth(20);

        ws.cell(1, 1, 1, 5, true).string(`${sedeInfo.nombreEmpresa}`).style(styleTitle);
        ws.cell(2, 1, 2, 5, true).string(`RUC: ${sedeInfo.ruc}`).style(styleTitle);
        ws.cell(3, 1, 3, 5, true).string(`${sedeInfo.direccion}`).style(styleTitle);
        ws.cell(4, 1, 4, 5, true).string(`Celular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`).style(styleTitle);

        ws.cell(6, 1, 6, 5, true).string(`LISTA DE SOCIOS AGREGADOS POR FECHA`).style(styleTitle);
        ws.cell(7, 1, 7, 5, true).string(req.query.porProyecto == "1" ? "TODOS LOS PROYECTOS" : `PROYECTO: ${req.query.nombreProyecto}`).style(styleTitle);

        const header = ["N°", "Documento", "Socio", "Celular", "Teléfono"];
        header.map((item, index) => ws.cell(9, 1 + index).string(item).style(styleTableHeader).style(fillVenta));

        let rowY = 9;
        data.map((item, index) => {
            rowY = rowY + 1;

            ws.cell(rowY, 1).number(1 + index).style(styleBodyInteger).style(fillSocio);
            ws.cell(rowY, 2).string(item.documento).style(styleBody).style(fillSocio);
            ws.cell(rowY, 3).string(item.informacion).style(styleBody).style(fillSocio);
            ws.cell(rowY, 4).string(item.celular).style(styleBody).style(fillSocio);
            ws.cell(rowY, 5).string(item.telefono).style(styleBody).style(fillSocio);

            rowY = rowY + 1;
            ws.cell(rowY, 1).string("COMPROBANTE").style(styleSubTitle).style(fillVenta);
            ws.cell(rowY, 2).string("FECHA").style(styleSubTitle).style(fillVenta);
            ws.cell(rowY, 3).string("LOTE").style(styleSubTitle).style(fillVenta);
            ws.cell(rowY, 4).string("FRECUENCIA").style(styleSubTitle).style(fillVenta);
            ws.cell(rowY, 5).string("MONTO TOTAL").style(styleSubTitle).style(fillVenta);

            for (const venta of item.detalle) {
                rowY = rowY + 1;
                ws.cell(rowY, 1).string(venta.serie + "-" + venta.numeracion).style(styleBody).style(textSize);
                ws.cell(rowY, 2).string(venta.fecha).style(styleBody).style(textSize);
                ws.cell(rowY, 3).string(venta.lote + " - " + venta.manzana).style(styleBody).style(textSize);
                ws.cell(rowY, 4).string(venta.frecuencia).style(styleBody).style(textSize);
                ws.cell(rowY, 5).number(parseFloat(formatMoney(venta.monto))).style(styleBodyFloat).style(textSize)
            }
        });
        rowY = rowY + 1;

        return wb.writeToBuffer();
    } catch (error) {
        console.log(error);
        return "Error en generar el excel.";
    }
}


module.exports = { generateExcelCliente, generateExcelDeudas, generarSociosPorFecha }