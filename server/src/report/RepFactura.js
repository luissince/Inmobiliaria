const path = require('path');
const PDFDocument = require("pdfkit-table");
const getStream = require('get-stream');
const qr = require("qrcode");
const NumberLleters = require('../tools/NumberLleters');
const { formatMoney, numberFormat, calculateTaxBruto, calculateTax, dateFormat, zfill, isFile, manzanaLote } = require('../tools/Tools');


const numberLleters = new NumberLleters();

class RepFactura {

    async repComprobante(req, sedeInfo, data) {
        const cabecera = data.cabecera;
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

            doc.info["Title"] = `${cabecera.comprobante} ${cabecera.serie + "-" + cabecera.numeracion}`

            let orgX = doc.x;
            let orgY = doc.y;

            let medioX = doc.page.width / 2;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), orgX, orgY, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), orgX, orgY, { width: 75 });
            }

            let center = doc.page.width - doc.options.margins.left - doc.options.margins.right - 150 - 150;

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                doc.options.margins.left + 150,
                orgY + 10,
                {
                    width: center,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}\n${sedeInfo.email}`,
                doc.options.margins.left + 150,
                doc.y,
                {
                    width: center,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `RUC: ${sedeInfo.ruc}\n${cabecera.comprobante}\n${cabecera.serie + "-" + cabecera.numeracion}`,
                doc.page.width - 150 - doc.options.margins.right,
                orgY + 20,
                {
                    width: 150,
                    align: "center",
                }
            );

            doc.rect(
                doc.page.width - 150 - doc.options.margins.right,
                orgY,
                150,
                70).stroke();

            doc.fontSize(h3).opacity(0.7).text(
                "INFORMACIÓN",
                doc.options.margins.top,
                doc.y + 30
            );

            doc.opacity(1).fill("#000000");

            let topCebecera = doc.y + 5;

            doc.lineGap(4);

            doc.fontSize(h3).text(
                `Tipo de documento: ${cabecera.tipoDoc} \nN° de documento: ${cabecera.documento} \nNombre/Razón Social: ${cabecera.informacion}\nDirección: ${cabecera.direccion}`,
                doc.options.margins.left,
                topCebecera
            );

            doc.fontSize(h3).text(
                `Fecha: ${cabecera.fecha} \nMoneda: ${cabecera.moneda + " - " + cabecera.codiso} \nForma de Venta: ${cabecera.tipo == 1 ? "CONTADO" : "CRÉDITO"}`,
                medioX,
                topCebecera
            );

            doc.lineGap(0);

            doc.x = doc.options.margins.left;

            let detalle = data.detalle.map((item, index) => {
                console.log(item.lote)
                return [++index, item.medida, item.cantidad, manzanaLote(item.lote, item.manzana), numberFormat(item.precio, cabecera.codiso), numberFormat((item.precio * item.cantidad), cabecera.codiso)];
            });


            const table = {
                subtitle: "DETALLE",
                headers: ["Ítem", "Medida", "Cantidad", "Descripción", "Valor Unitario", "Precio de Venta"],
                rows: detalle,
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [30, 80, 90, 152, 90, 90],
                x: doc.x,
                y: doc.y + 20,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.x = 0;

            let subTotal = 0;
            let impuestoTotal = 0;
            let total = 0;
            let impuestos = [];

            for (let item of data.detalle) {
                let cantidad = item.cantidad;
                let valor = item.precio;

                let impuesto = item.porcentaje;

                let valorActual = cantidad * valor;
                let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
                let valorImpuesto = calculateTax(impuesto, valorSubNeto);
                let valorNeto = valorSubNeto + valorImpuesto;

                impuestos.push({ "idImpuesto": item.idImpuesto, "nombre": item.impuesto, "valor": valorImpuesto });

                subTotal += valorSubNeto;
                impuestoTotal += valorImpuesto;
                total += valorNeto;
            }

            // console.log(impuestos)
            let arrayImpuestos = [];
            for (let item of impuestos) {
                if (!this.duplicateImpuestos(arrayImpuestos, item)) {
                    arrayImpuestos.push(item)
                } else {
                    for (let newItem of arrayImpuestos) {
                        if (newItem.idImpuesto === item.idImpuesto) {
                            let currenteObject = newItem;
                            currenteObject.valor += parseFloat(item.valor);
                            break;
                        }
                    }
                }
            }

            let ypost = doc.y + 5;
            doc.fontSize(h3);

            let text = "IMPORTE BRUTO:";
            let widthtext = doc.widthOfString(text);

            let subtext = numberFormat(subTotal, cabecera.codiso);
            let widthsubtext = doc.widthOfString(subtext);

            doc.font('Helvetica').text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.font('Helvetica-Bold').text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                align: "right",
            });

            // 
            ypost = doc.y + 5;

            text = "DESCUENTO:";
            widthtext = doc.widthOfString(text);

            subtext = numberFormat(0, cabecera.codiso);
            widthsubtext = doc.widthOfString(subtext);

            doc.font('Helvetica').text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.font('Helvetica-Bold').text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                align: "right",
            });

            // 
            ypost = doc.y + 5;

            text = "SUB IMPORTE:";
            widthtext = doc.widthOfString(text);

            subtext = numberFormat(subTotal, cabecera.codiso);
            widthsubtext = doc.widthOfString(subtext);

            doc.font('Helvetica').text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.font('Helvetica-Bold').text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                align: "right",
            });

            // 

            for (let item of arrayImpuestos) {
                ypost = doc.y + 5;

                text = item.nombre + ":";
                widthtext = doc.widthOfString(text);

                subtext = numberFormat(item.valor, cabecera.codiso);
                widthsubtext = doc.widthOfString(subtext);

                doc.font('Helvetica').text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                    align: "right",
                });

                doc.font('Helvetica-Bold').text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    align: "right",
                });
            }

            // 
            ypost = doc.y + 5;

            text = "IMPORTE NETO:";
            widthtext = doc.widthOfString(text);

            subtext = numberFormat(total, cabecera.codiso);
            widthsubtext = doc.widthOfString(subtext);

            doc.font('Helvetica').text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.font('Helvetica-Bold').text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                align: "right",
            });

            doc.font('Helvetica').fontSize(h3).text(`SON: ${numberLleters.getResult(formatMoney(total), cabecera.moneda)}`,
                doc.options.margins.left,
                doc.y + 5);

            let qrResult = await this.qrGenerate(`|
            ${sedeInfo.ruc}|
            ${cabecera.codigoVenta}|
            ${cabecera.serie}|
            ${cabecera.numeracion}|
            ${impuestoTotal}|
            ${total}|
            ${cabecera.fecha}|
            ${cabecera.codigoCliente}|
            ${cabecera.documento}|`);

            doc.image(qrResult, doc.options.margins.left, doc.y, { width: 100, });

            if (cabecera.estado === 3) {
                doc.save();
                doc.rotate(-45, { origin: [200, 450] });
                doc.fontSize(100).fillColor("#cccccc").opacity(0.5).text('ANULADO', (doc.page.width - 500) / 2, 450, {
                    textAlign: 'center',
                });
                doc.rotate(-45 * (-1), { origin: [200, 450] });
                doc.restore();
            }

            doc.end();
            return getStream.buffer(doc);

        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

    async repCobro(req, sedeInfo, data) {
        const cabecera = data.cabecera;
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

            doc.info["Title"] = `${cabecera.comprobante} ${cabecera.serie + "-" + cabecera.numeracion}`

            let orgX = doc.x;
            let orgY = doc.y;

            let medioX = doc.page.width / 2;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), orgX, orgY, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), orgX, orgY, { width: 75 });
            }

            let center = doc.page.width - doc.options.margins.left - doc.options.margins.right - 150 - 150;

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                doc.options.margins.left + 150,
                orgY + 10,
                {
                    width: center,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}\n${sedeInfo.email}`,
                doc.options.margins.left + 150,
                doc.y,
                {
                    width: center,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `RUC: ${sedeInfo.ruc}\n${cabecera.comprobante}\n${cabecera.serie + "-" + cabecera.numeracion}`,
                doc.page.width - 150 - doc.options.margins.right,
                orgY + 20,
                {
                    width: 150,
                    align: "center",
                }
            );

            doc.rect(
                doc.page.width - 150 - doc.options.margins.right,
                orgY,
                150,
                70).stroke();

            doc.fontSize(h3).fill('#777').text(
                "INFORMACIÓN",
                doc.options.margins.top,
                doc.y + 30
            );

            doc.fill("#000000");
            doc.lineGap(4);

            let topCebecera = doc.y + 5;

            doc.fontSize(h3).text(
                `Tipo de documento: ${cabecera.tipoDoc} \nN° de documento: ${cabecera.documento} \nNombre/Razón Social: ${cabecera.informacion}\nDirección: ${cabecera.direccion}`,
                doc.options.margins.left,
                topCebecera
            );

            doc.fontSize(h3).text(
                `Fecha: ${cabecera.fecha} \nMoneda: ${cabecera.moneda + " - " + cabecera.codiso}`,
                medioX,
                topCebecera
            );
            doc.lineGap(0);

            doc.x = doc.options.margins.left;


            let detalle = data.detalle.length > 0 ?
                data.detalle.map((item, index) => {
                    return [++index, item.concepto, item.cantidad, item.impuesto, numberFormat(item.precio, cabecera.codiso), numberFormat((item.precio * item.cantidad), cabecera.codiso)];
                })
                :
                data.venta.map((item, index) => {
                    return [++index, item.concepto + "\n" + item.comprobante + " " + item.serie + "-" + item.numeracion, "", 1, numberFormat(item.precio, cabecera.codiso), numberFormat(item.precio, cabecera.codiso)];
                });

            const table = {
                subtitle: "DETALLE",
                headers: data.detalle.length > 0 ? ["Ítem", "Concepto", "Cantidad", "Impuesto", "Valor", "Monto"] : ["Ítem", "Concepto", "", "Cantidad", "Valor", "Monto"],
                rows: detalle,
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [30, 152, 80, 90, 90, 90],
                x: doc.x,
                y: doc.y + 30,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.x = 0;

            let subTotal = 0;
            let impuestoTotal = 0;
            let total = 0;
            let impuestos = [];
            let arrayImpuestos = [];

            if (data.detalle.length > 0) {
                for (let item of data.detalle) {
                    let cantidad = item.cantidad;
                    let valor = item.precio;

                    let impuesto = item.porcentaje;

                    let valorActual = cantidad * valor;
                    let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
                    let valorImpuesto = calculateTax(impuesto, valorSubNeto);
                    let valorNeto = valorSubNeto + valorImpuesto;

                    impuestos.push({ "idImpuesto": item.idImpuesto, "nombre": item.impuesto, "valor": valorImpuesto });

                    subTotal += valorSubNeto;
                    impuestoTotal += valorImpuesto;
                    total += valorNeto;
                }


                for (let item of impuestos) {
                    if (!this.duplicateImpuestos(arrayImpuestos, item)) {
                        arrayImpuestos.push(item)
                    } else {
                        for (let newItem of arrayImpuestos) {
                            if (newItem.idImpuesto === item.idImpuesto) {
                                let currenteObject = newItem;
                                currenteObject.valor += parseFloat(item.valor);
                                break;
                            }
                        }
                    }
                }
            } else {
                for (let item of data.venta) {
                    total += item.precio;
                }
            }

            // 
            if (data.detalle.length > 0) {
                let ypost = doc.y + 5;

                let text = "SUB IMPORTE:";
                let widthtext = doc.widthOfString(text);

                let subtext = numberFormat(subTotal, cabecera.codiso);
                let widthsubtext = doc.widthOfString(subtext);

                doc.font("Helvetica").text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                    align: "right",
                });

                doc.font("Helvetica-Bold").text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    align: "right",
                });

                // 

                for (let item of arrayImpuestos) {
                    ypost = doc.y + 5;

                    text = item.nombre + ":";
                    widthtext = doc.widthOfString(text);

                    subtext = numberFormat(item.valor, cabecera.codiso);
                    widthsubtext = doc.widthOfString(subtext);

                    doc.font("Helvetica").text(text,
                        doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                        ypost, {
                        width: widthtext + 10,
                        align: "right",
                    });

                    doc.font("Helvetica-Bold").text(subtext,
                        doc.page.width - doc.options.margins.right - widthsubtext,
                        ypost, {
                        width: widthsubtext,
                        align: "right",
                    });
                }

                // 
                ypost = doc.y + 5;

                text = "IMPORTE NETO:";
                widthtext = doc.widthOfString(text);

                subtext = numberFormat(total, cabecera.codiso);
                widthsubtext = doc.widthOfString(subtext);

                doc.font("Helvetica").text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                    align: "right",
                });

                doc.font("Helvetica-Bold").text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    align: "right",
                });
            } else {
                let ypost = doc.y + 5;

                let text = "IMPORTE TOTAL:";
                let widthtext = doc.widthOfString(text);

                let subtext = numberFormat(total, cabecera.codiso);
                let widthsubtext = doc.widthOfString(subtext);

                doc.font("Helvetica").text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                });

                doc.font("Helvetica-Bold").text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    align: "right",
                });
            }

            doc.font("Helvetica").fontSize(h3).text(`SON: ${numberLleters.getResult(formatMoney(total), cabecera.moneda)}`,
                doc.options.margins.left,
                doc.y + 5);

            // let qrResult = await this.qrGenerate(`|
            // ${sedeInfo.ruc}|
            // ${cabecera.codigoVenta}|
            // ${cabecera.serie}|
            // ${cabecera.numeracion}|
            // ${impuestoTotal}|
            // ${total}|
            // ${cabecera.fecha}|
            // ${cabecera.codigoCliente}|
            // ${cabecera.documento}|`);

            // doc.image(qrResult, doc.options.margins.left, doc.y, { width: 100, });

            doc.end();
            return getStream.buffer(doc);

        } catch (error) {
            console.log(error);
            return "Se genero un error al generar el reporte.";
        }
    }

    async repGasto(req, sedeInfo, data) {
        const cabecera = data.cabecera;
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

            doc.info["Title"] = `${cabecera.comprobante} ${cabecera.serie + "-" + cabecera.numeracion}`

            let orgX = doc.x;
            let orgY = doc.y;

            let medioX = doc.page.width / 2;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), orgX, orgY, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), orgX, orgY, { width: 75 });
            }

            let center = doc.page.width - doc.options.margins.left - doc.options.margins.right - 150 - 150;

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                doc.options.margins.left + 150,
                orgY + 10,
                {
                    width: center,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}\n${sedeInfo.email}`,
                doc.options.margins.left + 150,
                doc.y,
                {
                    width: center,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `RUC: ${sedeInfo.ruc}\n${cabecera.comprobante}\n${cabecera.serie + "-" + cabecera.numeracion}`,
                doc.page.width - 150 - doc.options.margins.right,
                orgY + 20,
                {
                    width: 150,
                    align: "center",
                }
            );

            doc.rect(
                doc.page.width - 150 - doc.options.margins.right,
                orgY,
                150,
                70).stroke();

            doc.fontSize(h3).fill('#777').text(
                "INFORMACIÓN",
                doc.options.margins.top,
                doc.y + 30
            );

            doc.fill("#000000");

            let topCebecera = doc.y + 5;

            doc.lineGap(4);

            doc.fontSize(h3).text(
                `Tipo de documento: ${cabecera.tipoDoc} \nN° de documento: ${cabecera.documento} \nNombre/Razón Social: ${cabecera.informacion}\nDirección: ${cabecera.direccion}`,
                doc.options.margins.left,
                topCebecera
            );

            doc.fontSize(h3).text(
                `Fecha: ${cabecera.fecha} \nMoneda: ${cabecera.moneda + " - " + cabecera.codiso}`,
                medioX,
                topCebecera
            );

            doc.lineGap(0);

            doc.x = doc.options.margins.left;

            let detalle = data.detalle.map((item, index) => {
                return [++index, item.concepto, item.cantidad, item.impuesto, , numberFormat((item.precio * item.cantidad), cabecera.codiso)];
            })

            const table = {
                subtitle: "DETALLE",
                headers: ["Ítem", "Concepto", "Cantidad", "Impuesto", "Valor", "Monto"],
                rows: detalle,
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [30, 152, 80, 90, 90, 90],
                x: doc.x,
                y: doc.y + 30,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.x = 0;

            let subTotal = 0;
            let impuestoTotal = 0;
            let total = 0;
            let impuestos = [];
            let arrayImpuestos = [];

            for (let item of data.detalle) {
                let cantidad = item.cantidad;
                let valor = item.precio;

                let impuesto = item.porcentaje;

                let valorActual = cantidad * valor;
                let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
                let valorImpuesto = calculateTax(impuesto, valorSubNeto);
                let valorNeto = valorSubNeto + valorImpuesto;

                impuestos.push({ "idImpuesto": item.idImpuesto, "nombre": item.impuesto, "valor": valorImpuesto });

                subTotal += valorSubNeto;
                impuestoTotal += valorImpuesto;
                total += valorNeto;
            }


            for (let item of impuestos) {
                if (!this.duplicateImpuestos(arrayImpuestos, item)) {
                    arrayImpuestos.push(item)
                } else {
                    for (let newItem of arrayImpuestos) {
                        if (newItem.idImpuesto === item.idImpuesto) {
                            let currenteObject = newItem;
                            currenteObject.valor += parseFloat(item.valor);
                            break;
                        }
                    }
                }
            }

            let ypost = doc.y + 5;

            let text = "SUB IMPORTE:";
            let widthtext = doc.widthOfString(text);

            let subtext = numberFormat(subTotal, cabecera.codiso);
            let widthsubtext = doc.widthOfString(subtext);

            doc.font('Helvetica').text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.font('Helvetica-Bold').text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                align: "right",
            });

            // 

            for (let item of arrayImpuestos) {
                ypost = doc.y + 5;

                text = item.nombre + ":";
                widthtext = doc.widthOfString(text);

                subtext = numberFormat(item.valor, cabecera.codiso);
                widthsubtext = doc.widthOfString(subtext);

                doc.font('Helvetica').text(text,
                    doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                    ypost, {
                    width: widthtext + 10,
                    align: "right",
                });

                doc.font('Helvetica-Bold').text(subtext,
                    doc.page.width - doc.options.margins.right - widthsubtext,
                    ypost, {
                    width: widthsubtext,
                    align: "right",
                });
            }

            // 
            ypost = doc.y + 5;

            text = "IMPORTE NETO:";
            widthtext = doc.widthOfString(text);

            subtext = numberFormat(total, cabecera.codiso);
            widthsubtext = doc.widthOfString(subtext);

            doc.font('Helvetica').text(text,
                doc.page.width - doc.options.margins.right - widthtext - widthsubtext - 20,
                ypost, {
                width: widthtext + 10,
                align: "right",
            });

            doc.font('Helvetica-Bold').text(subtext,
                doc.page.width - doc.options.margins.right - widthsubtext,
                ypost, {
                width: widthsubtext,
                align: "right",
            });

            doc.font('Helvetica').fontSize(h3).text(`SON: ${numberLleters.getResult(formatMoney(total), cabecera.moneda)}`,
                doc.options.margins.left,
                doc.y + 5);

            doc.end();
            return getStream.buffer(doc);

        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

    async repCobroA5(req, sedeInfo, data) {

        const cabecera = data.cabecera;
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = `${cabecera.comprobante} ${cabecera.serie + "-" + cabecera.numeracion}`

            let yPos = 101.00;

            doc.fontSize(9).text(`${cabecera.fecha}`,
                doc.options.margins.left + 22,
                yPos + 14);

            doc.fontSize(9).text(`${zfill(cabecera.numeracion)}`,
                doc.options.margins.left + 400,
                yPos + 14);


            yPos = doc.y + 3;

            doc.fontSize(9).text(`${cabecera.informacion}  ${cabecera.documento}`,
                doc.options.margins.left + 22,
                yPos);

            doc.fontSize(8).text(`${cabecera.compRelacion}`,
                doc.options.margins.left + 400,
                yPos);

            let total = 0;

            if (data.detalle.length > 0) {
                yPos = doc.y + 25;

                data.detalle.map((item, index) => {
                    doc.fontSize(10).text((index + 1),
                        doc.options.margins.left + 10,
                        yPos);

                    doc.fontSize(9).text(item.concepto,
                        doc.options.margins.left + 80,
                        yPos);

                    // doc.fontSize(8).text("0",
                    // doc.options.margins.left + 400,
                    // yPos);

                    doc.fontSize(8).text(numberFormat(item.precio, cabecera.codiso),
                        doc.options.margins.left + 460,
                        yPos);


                    yPos += 10;
                });
            } else {
                yPos = doc.y + 25;

                data.venta.map((item, index) => {
                    doc.fontSize(10).text((index + 1),
                        doc.options.margins.left + 10,
                        yPos);

                    doc.fontSize(9).text(item.concepto,
                        doc.options.margins.left + 80,
                        yPos);

                    // doc.fontSize(8).text("0",
                    // doc.options.margins.left + 400,
                    // yPos);

                    doc.fontSize(8).text(numberFormat(item.precio, cabecera.codiso),
                        doc.options.margins.left + 460,
                        yPos);


                    yPos += 10;
                    total += item.precio;
                });
            }

            yPos = 323;

            doc.fontSize(9).text(`SON: ${numberLleters.getResult(formatMoney(total), cabecera.moneda)}`,
                doc.options.margins.left + 10,
                yPos);

            doc.fontSize(8).text(`${numberFormat(total, cabecera.codiso)}`,
                doc.options.margins.left + 460,
                yPos);


            doc.end();
            return getStream.buffer(doc);

        } catch (error) {
            console.log(error);
            return "Se genero un error al generar el reporte.";
        }
    }

    async repLetraA5(req, sedeInfo, data) {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 0
                }
            });

            let yPos = 130;
            // 

            doc.fontSize(10).text(`${req.query.index}`,
                doc.options.margins.left + 100,
                yPos);

            doc.fontSize(10).text("",
                doc.options.margins.left + 170,
                yPos);

            doc.fontSize(10).text("",
                doc.options.margins.left + 240,
                yPos + 8);

            doc.fontSize(10).text(`${sedeInfo.departamento}`,
                doc.options.margins.left + 320,
                yPos);

            doc.fontSize(10).text(`${data.fecha}`,
                doc.options.margins.left + 385,
                yPos + 8);

            doc.fontSize(10).text(`${data.simbolo} ${data.monto}`,
                doc.options.margins.left + 470,
                yPos);

            // 

            yPos = 171;

            doc.fontSize(10).text(`${numberLleters.getResult(formatMoney(data.monto), data.moneda)}`,
                doc.options.margins.left + 150,
                yPos);

            // 

            yPos = 205;

            doc.fontSize(10).text(`${data.informacion}`,
                doc.options.margins.left + 140,
                yPos);
            // 

            yPos = doc.y + 10;

            doc.fontSize(10).text("",
                doc.options.margins.left + 320,
                yPos);

            doc.fontSize(10).text("",
                doc.options.margins.left + 370,
                yPos);

            doc.fontSize(10).text("",
                doc.options.margins.left + 420,
                yPos);

            doc.fontSize(9).text("",
                doc.options.margins.left + 500,
                yPos);

            // 

            yPos = 235;

            
            doc.fontSize(10).text(`${manzanaLote(data.descripcion, data.manzana)}`,
                doc.options.margins.left + 140,
                yPos);

            yPos = 251.56;

            doc.fontSize(10).text(``,
                doc.options.margins.left + 230,
                yPos);

            // 

            yPos = 263;

            doc.fontSize(10).text("",
                doc.options.margins.left + 140,
                yPos);

            doc.fontSize(10).text(``,
                doc.options.margins.left + 230,
                yPos);

            // 

            yPos = 283;

            doc.fontSize(10).text("",
                doc.options.margins.left + 160,
                yPos);

            // 

            yPos = 309;

            doc.fontSize(10).text("",
                doc.options.margins.left + 140,
                yPos);

            // 

            yPos = 335;

            doc.fontSize(10).text("",
                doc.options.margins.left + 140,
                yPos);

            doc.fontSize(10).text("",
                doc.options.margins.left + 235,
                yPos);

            // 

            yPos = 351;

            doc.fontSize(10).text("",
                doc.options.margins.left + 120,
                yPos);

            // 

            yPos = 358;

            doc.fontSize(10).text("",
                doc.options.margins.left + 345,
                yPos);

            doc.end();
            return getStream.buffer(doc);

        } catch (error) {
            console.log(error);
            return "Se genero un error al generar el reporte.";
        }
    }

    duplicateImpuestos(array, impuesto) {
        let value = false
        for (let item of array) {
            if (item.idImpuesto === impuesto.idImpuesto) {
                value = true
                break;
            }
        }
        return value
    }

    qrGenerate(data) {
        return new Promise((resolve, reject) => {
            qr.toDataURL(data, (err, src) => {
                if (err) reject("Error occured");

                resolve(src);
            });
        })
    }

    async repVentas(req, sedeInfo, data) {
        try {
            const doc = new PDFDocument({
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = `REPORTE DE VENTAS DEL ${req.query.fechaIni} AL ${req.query.fechaFin}`

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 70;
            let filtroY = cabeceraY + 40;
            let bodY = filtroY + 55;
            let titleX = orgX + 150;
            let medioX = (doc.page.width - doc.options.margins.left - doc.options.margins.right) / 2;
            let widthContent = doc.page.width - doc.options.margins.left - doc.options.margins.right;

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
                "REPORTE GENERAL DE VENTAS",
                doc.options.margins.left,
                cabeceraY,
                {
                    width: widthContent,
                    align: "center",
                }
            );

            doc.fontSize(h3).opacity(0.7).text(
                `PERIODO: ${dateFormat(req.query.fechaIni)} al ${dateFormat(req.query.fechaFin)}`,
                orgX,
                cabeceraY + 26,
                {
                    width: 300,
                    align: "left",
                }
            );

            doc.opacity(1);

            doc.fontSize(h3).text(
                `Comprobante(s): ${req.query.idComprobante === '' ? "TODOS" : req.query.comprobante}`,
                orgX,
                filtroY + 6
            );
            doc.fontSize(h3).text(
                `Cliente(s): ${req.query.idCliente === '' ? "TODOS" : req.query.cliente}`,
                orgX,
                filtroY + 20
            );
            doc.fontSize(h3).text(
                `Vendedor(s): ${req.query.idUsuario === '' ? "TODOS" : req.query.usuario}`,
                orgX,
                filtroY + 34
            );

            doc.fontSize(h3).text(
                `Tipo(s): ${req.query.tipoVenta === 0 ? "TODOS" : req.query.tipo}`,
                medioX + 15,
                filtroY + 6
            );

            let contadoCount = 0;
            let creditoCount = 0;

            let content = data.map((item, index) => {
                creditoCount += item.tipo === "CRÉDITO" && item.estado !== "ANULADO" ? item.total : 0;
                contadoCount += item.tipo === "CONTADO" && item.estado !== "ANULADO" ? item.total : 0;
                return [
                    item.fecha,
                    item.documento + "\n" + item.informacion,
                    item.comprobante + "\n" + item.serie + "-" + item.numeracion,
                    item.tipo,
                    item.estado,
                    numberFormat(item.total, item.codiso)]
            });

            const table = {
                subtitle: "DETALLE",
                headers: ["Fecha", "Cliente", "Comprobante", "Tipo", "Estado", "Importe"],
                rows: content.length == 0 ? [["No hay datos para mostrar"]] : content
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [60, 102, 100, 90, 90, 90],
                x: orgX,
                y: bodY,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            let ypost = doc.y + 5;
            doc.fontSize(h3).font("Helvetica-Bold");

            let nameContado = "TOTAL AL CONTADO:";
            let nameCredito = "TOTAL AL CRÉDITO:";
            let widthNameContado = Math.ceil(doc.widthOfString(nameContado));
            let widthNameCredito = Math.ceil(doc.widthOfString(nameCredito));

            let totalContado = numberFormat(contadoCount);
            let totalCredito = numberFormat(creditoCount);

            let widthTotalContado = Math.ceil(doc.widthOfString(totalContado));
            let widthTotalCredito = Math.ceil(doc.widthOfString(totalCredito));


            doc.text(nameContado,
                doc.page.width - doc.options.margins.right - widthNameContado - widthTotalContado - 20,
                ypost, {
                width: widthNameContado + 10,
                align: "right",
            });

            doc.text(totalContado,
                doc.page.width - doc.options.margins.right - widthTotalContado,
                ypost, {
                width: widthTotalContado,
                align: "right",
            });

            ypost = doc.y + 5;

            doc.text(nameCredito,
                doc.page.width - doc.options.margins.right - widthNameCredito - widthTotalCredito - 20,
                ypost, {
                width: widthNameCredito + 10,
                align: "right"
            });

            doc.text(totalCredito,
                doc.page.width - doc.options.margins.right - widthTotalCredito,
                ypost, {
                width: widthTotalCredito,
                align: "right",
            });

            doc.end();

            return getStream.buffer(doc);
        } catch (error) {
            console.log(error);
            return "Se genero un error al generar el reporte.";
        }
    }

}

module.exports = RepFactura;