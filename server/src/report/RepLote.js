const path = require('path');
const PDFDocument = require("pdfkit-table");
const getStream = require('get-stream');
const { numberFormat, currentDate, isFile } = require('../tools/Tools');

class RepLote {

    async repDetalleLote(sedeInfo, data) {

        const lote = data.lote

        try {
            const doc = new PDFDocument({
                font: 'Helvetica',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });


            doc.info["Title"] = "Detalle del Lote.pdf"

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 80;
            let titleX = orgX + 150;
            let medioX = (doc.page.width - doc.options.margins.left - doc.options.margins.right) / 2;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;
            let h4 = 8;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), doc.x, doc.y, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), doc.x, doc.y, { width: 75 });
            }

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                titleX,
                orgY,
                {
                    width: 250,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `RUC: ${sedeInfo.ruc}\n${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`,
                titleX,
                orgY + 17,
                {
                    width: 250,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                "RESUMEN DE LOTE",
                medioX,
                cabeceraY,
                {
                    width: 250,
                }
            );

            doc.x = doc.options.margins.left;

            let colY = doc.y + 10;

            doc.opacity(0.7);
            doc.fontSize(h3).text(
                "DESCRIPCIÓN",
                orgX,
                colY
            );

            doc.fill("#000000");
            doc.lineGap(4);
            doc.opacity(1);

            doc.fontSize(h3).text(
                `Manzana: ${lote.manzana}\nLote: ${lote.lote}\nEstado: ${lote.lotestado}`,
                orgX,
                doc.y + 5
            );

            doc.lineGap(0);

            doc.opacity(0.7);
            doc.fontSize(h3).text(
                "MEDIDAS",
                orgX + 170,
                colY
            );

            doc.fill("#000000");
            doc.lineGap(4);
            doc.opacity(1);

            doc.fontSize(h3).text(
                `Medida Frontal: ${lote.medidaFrontal}\nCoste Derecho: ${lote.costadoDerecho}\nCoste Izquierdo: ${lote.costadoIzquierdo}\nMedida Fondo: ${lote.medidaFondo}\nArea Lote: ${lote.areaLote}\nN° Partida: ${lote.numeroPartida}`,
                orgX + 170,
                doc.y + 5
            );

            doc.lineGap(0);

            doc.opacity(0.7);
            doc.fontSize(h3).text(
                "LÍMITE",
                orgX + 340,
                colY
            );

            doc.fill("#000000");
            doc.lineGap(4);
            doc.opacity(1);

            doc.fontSize(h3).text(
                `Limite, Frontal / Norte / Noroeste: ${lote.limiteFrontal === '' ? '-' : lote.limiteFrontal}\nLímite, Derecho / Este / Sureste: ${lote.limiteDerecho === '' ? '-' : lote.limiteDerecho}\nLímite, Iquierdo / Sur / Sureste: ${lote.limiteIzquierdo === '' ? '-' : lote.limiteIzquierdo}\nLímite, Posterior / Oeste / Noroeste: ${lote.limitePosterior === '' ? '-' : lote.limitePosterior}\nUbicación del Lote: ${lote.ubicacionLote === '' ? '-' : lote.ubicacionLote}`,
                orgX + 340,
                doc.y + 5
            );

            colY = doc.y + 10;

            doc.lineGap(0);

            const contentSocios = data.socios.map((item, index) => {
                return [++index, item.documento, item.informacion, item.estado === 1 ? "ACTIVO" : "ANULADO"];
            });

            const socios = {
                subtitle: "SOCIOS",
                headers: ["#", "N° Documento", "Información", "Estado"],
                rows: contentSocios
            };

            doc.table(socios, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [40, 172, 230, 90],//532
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right,
                x: orgX,
                y: colY,
            });

            colY = doc.y + 10;

            const contentCobros = data.detalle.map((item, index) => {
                return [++index, item.informacion, item.detalle, item.fecha + "\n" + item.hora, item.comprobante + "\n" + item.serie + "-" + item.numeracion, item.banco, numberFormat(item.monto, item.codiso)];
            });

            const cobros = {
                subtitle: "COBRO ASOCIADOS",
                headers: ["#", "Socio", "Concepto", "Fecha", "Comprobante", "Banco", "Monto"],
                rows: contentCobros
            };

            doc.table(cobros, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h4);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [40, 92, 100, 70, 90, 70, 70],//532
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right,
                x: orgX,
                y: colY,
            });

            // doc.moveDown();

            // let content = data.detalle.map((item, index) => {
            //     return [item.concepto, formatMoney(item.monto), item.metodo, item.banco, item.fecha]
            // })

            // const table1 = {
            //     subtitle: "DETALLE DE PAGOS ASOCIADOS",
            //     headers: ["Concepto", "Monto", "Método", "Banco", "Fecha"],
            //     rows: content.length === 0 ? [["No hay pagos asociados."]] : content
            // };

            // doc.table(table1, {
            //     prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h2),
            //     prepareRow: () => {
            //         doc.font("Helvetica").fontSize(h3);
            //     },
            //     width: doc.page.width - doc.options.margins.left - doc.options.margins.right,
            //     x: orgX,
            //     y: doc.y + 10,
            // });


            doc.end();

            return getStream.buffer(doc);
        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

    async repTipoLote(req, sedeInfo, data) {
        try {

            const doc = new PDFDocument({
                font: 'Helvetica',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = `DETALLE DE LOTES AL ${currentDate()}.pdf`

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 70;
            let titleX = orgX + 150;
            let medioX = (doc.page.width - doc.options.margins.left - doc.options.margins.right) / 2;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), doc.x, doc.y, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), doc.x, doc.y, { width: 75 });
            }

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                titleX,
                orgY,
                {
                    width: 250,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `RUC: ${sedeInfo.ruc}\n${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`,
                titleX,
                orgY + 17,
                {
                    width: 250,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                "REPORTE DE LOTES",
                medioX,
                cabeceraY,
                {
                    width: 250,
                    align: "left"
                }
            );

            doc.fontSize(h3).text(
                `PROYECTO: ${data.proyecto.nombre}`,
                orgX,
                doc.y + 25,
                {
                    width: 300,
                    align: "left",
                }
            );

            doc.fontSize(h3).text(
                `UBICACIÓN: ${data.proyecto.ubicacion}`,
                orgX,
                doc.y + 5,
                {
                    width: 300,
                    align: "left",
                }
            );

            doc.fontSize(h3).text(
                `ÁREA: ${data.proyecto.area}  m²`,
                orgX,
                doc.y + 5,
                {
                    width: 300,
                    align: "left",
                }
            );


            const estadoLote = req.query.estadoLote == 0 ? 'TODOS LOS LOTES'
                : req.query.estadoLote == 1 ? 'LOTES DISPONIBLES'
                    : req.query.estadoLote == 2 ? 'LOTES RESERVADOS'
                        : req.query.estadoLote == 3 ? 'LOTES VENDIDOS' : 'LOTES INACTIVOS';

            let totalCosto = 0;
            let totalPrecio = 0;
            let totalUtilidad = 0;

            let content = data.lista.map((item, index) => {
                let estado = item.estado === 1 ? 'DISPONIBLE'
                    : item.estado === 2 ? 'RESERVADO'
                        : item.estado === 3 ? 'VENDIDO' : 'INACTIVO';

                totalCosto = totalCosto + item.costo;
                totalPrecio = totalPrecio + item.precio;
                totalUtilidad = totalUtilidad + (item.precio + item.costo);

                return [++index, item.manzana + '\n' + item.lote, item.areaLote, estado, numberFormat(item.costo), numberFormat(item.precio), numberFormat(item.precio - item.costo)]
            })

            content.push(["", "", "", "TOTAL", numberFormat(totalCosto), numberFormat(totalPrecio), numberFormat(totalUtilidad)])

            const table1 = {
                subtitle: `RESUMEN ASOCIADOS AL FILTRO: ${estadoLote} AL ${currentDate()}`,
                headers: ["N°", "Lotes", "Area m²", "Estado", "Costo", "Venta", "Utilidad"],
                rows: content
            };

            doc.table(table1, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [30, 152, 70, 70, 70, 70, 70],
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right,
                x: orgX,
                y: doc.y + 10,
            });

            doc.end();

            return getStream.buffer(doc);

        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

    async repLoteDeuda(req, sedeInfo, data) {
        try {

            const doc = new PDFDocument({
                font: 'Helvetica',
                layout: 'landscape',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = `Lista de Lotes con Deuda.pdf`

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 70;
            let titleX = orgX + 230;
            let widthContent = doc.page.width - doc.options.margins.left - doc.options.margins.right;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;
            let h4 = 8;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), orgX, orgY, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), orgX, orgY, { width: 75 });
            }

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                titleX,
                orgY,
                {
                    width: 250,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `RUC: ${sedeInfo.ruc}\n${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`,
                titleX,
                orgY + 17,
                {
                    width: 250,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                "LISTA DE LOTES CON DEUDA",
                doc.options.margins.left,
                cabeceraY,
                {
                    width: widthContent,
                    align: "center",
                }
            );

            doc.fontSize(h3).text(
                `${req.query.porProyecto == "0" ? "PROYECTO: " + req.query.nombreProyecto : "TODOS LOS PROYECTOS"}`,
                orgX,
                doc.y + 25,
                {
                    width: 300,
                    align: "left",
                }
            );

            const content = data.map((item, index) => {
                const cuotaPagada = item.cuoTotal - item.numCuota;
                return [
                    ++index,
                    item.documento + " " + item.informacion,
                    item.lote + " - " + item.manzana,
                    item.comprobante + " " + item.serie + "-" + item.numeracion,
                    item.primerPago,
                    numberFormat(item.cuotaMensual),
                    item.credito === 1 ? item.frecuencia : item.cuoTotal === 1 ? item.cuoTotal + " Cuota" : item.cuoTotal + " Cuotas",
                    item.credito === 1 ? "-" : cuotaPagada === 1 ? cuotaPagada + " Cuota" : cuotaPagada + " Cuotas",
                    item.credito === 1 ? "-" : item.numCuota === 1 ? item.numCuota + " Cuota" : item.numCuota + " Cuotas",
                    item.frecuenciaName,
                    numberFormat(item.total),
                    numberFormat(item.cobrado),
                    numberFormat(item.total - item.cobrado)
                ];
            });

            const table = {
                subtitle: `Detalle`,
                headers: ["N°", "Cliente", "Propiedad", "Comprobante", "1° Pago", "Cta Mensual", "Cta Total", "Ctas Pagadas", "Ctas Pendientes", "Frecuencia", "Total", "Cobrado", "Por Cobrar"],
                rows: content
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font("Helvetica").fontSize(h4).fillColor("black");
                },
                align: "center",
                padding: 5,
                columnSpacing: 5,
                columnsSize: [20, 81, 65, 71, 55, 55, 50, 50, 50, 50, 55, 55, 55],//712
                x: doc.x,
                y: doc.y + 15,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.end();

            return getStream.buffer(doc);

        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }
}

module.exports = RepLote;