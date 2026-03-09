import { createSlice } from "@reduxjs/toolkit";
import { closeProject, signOut } from "./principalSlice";

const initialState = {
    loading: false,
    lista: [],
    search: "",
    restart: false,

    opcion: 0,
    paginacion: 0,
    totalPaginacion: 0,
    filasPorPagina: 10,
    messageTable: 'Cargando información...',
    messagePaginacion: 'Mostranto 0 de 0 Páginas',
    paginacionState: {
        upperPageBound: 3,
        lowerPageBound: 0,
        isPrevBtnActive: "disabled",
        isNextBtnActive: "",
        pageBound: 3
    }
};

const ventasSlice = createSlice({
    name: "ventas",
    initialState,
    reducers: {
        setVentasState: (state, action) => {
            return { ...state, ...action.payload };
        }
    },
    extraReducers: (builder) => {
        builder.addCase(signOut, () => initialState);
        builder.addCase(closeProject, () => initialState);
    },
});

export const { setVentasState } = ventasSlice.actions;
export default ventasSlice.reducer;