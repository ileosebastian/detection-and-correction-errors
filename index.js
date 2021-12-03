document.addEventListener('DOMContentLoaded', () => {
    // para que todos los inputs se den en binario (1 o 0)    
    document.querySelectorAll('.i-bin').forEach(btn => {
        setInputFilter(btn, value => {
            return /^[0-1]*$/.test(value);
        });
    });
    
    // Evento que muestre la codificacion de Hamming  
    let InputBinHamEncode = document.querySelector('#i-bin-ham-encode');
    let BtnHamEncode = document.querySelector('#btn-calc-ham-encode');
    BtnHamEncode.addEventListener('click', event =>{
        // codigo hamming
        let InfoEncode = HammingEncode(InputBinHamEncode.value);

        document.querySelector('#o-encode-h').innerHTML = InfoEncode.pop();
        AddGeneralInfo(
            InputBinHamEncode.value,
            InfoEncode.pop(),
            InfoEncode.pop(),
            InfoEncode.pop()
        );
    }); 

    // Evento que muestre la decodificacion de Hamming  
    let InputBinHamDecode = document.querySelector('#i-bin-ham-decode');
    let BtnHamDecode = document.querySelector('#btn-calc-ham-decode');
    BtnHamDecode.addEventListener('click', event =>{
        // codigo hamming
        let bin = InputBinHamDecode.value;
        let InfoDecode = HammingDecode(bin);

        let binerr = InfoDecode.pop(), decerr = InfoDecode.pop();

        let msg = `El codigo de error es ${binerr}, es decir, que en 
                    la posicion numero ${decerr} es la que tiene el error.
                   <br> `;
        for (let i = 0; i < bin.length; i++) {
            msg += i == decerr - 1 ? `<em style="color: red"> ${bin[i]} </em>` : bin[i];  
        }

        document.querySelector('#o-decode-h').innerHTML = msg;
        AddGeneralInfo(
            bin,
            InfoDecode.pop(),
            InfoDecode.pop(),
            InfoDecode.pop()
        );
    });
});

function AddGeneralInfo(Info, N, B, M) {
    document.querySelector('#o-info-b').innerHTML = Info;
    document.querySelector('#o-info-d').innerHTML = parseInt(Info, 2);
    document.querySelector('#o-n').innerHTML = N;
    document.querySelector('#o-b').innerHTML = B;
    document.querySelector('#o-m').innerHTML = M;
    
    // definir si es par o impar
    let Bin = parseInt(Info);
    let decision = ((Bin & 1) != 1) ? "par" : "impar";
    document.querySelector('#o-odd-or-even').innerHTML = decision;
}

// Operaciones para codificar

// establecer parametros cuado se sabe solo M
function SetParametersEncode(Info) {
    let WCO = Info.split('').map(value => Number(value));
    
    let M = WCO.length;
    
    let B = 1, tmp = 1 + M;
    while ((2**B - B) < tmp) {
        B++;
    }

    let N = M + B;

    return [WCO, M, B, N];
}

// establecer parametros cuado se sabe solo N
function SetParametersDecode(Info) {
    let WCO = Info.split('').map(value => Number(value));
    
    let N = WCO.length;
    
    let B = 1, tmp = 1 + N;
    while (2**B < tmp) {
        B++;
    }

    let M = N - B;

    return [WCO, M, B, N];
}

function HammingEncode(Info) {
    // establecer parametros como M, B y N
    let params = SetParametersEncode(Info); 
    let WordCodeOriginal, M, B, N;
    [WordCodeOriginal, M, B, N] = params;

    let WordCode = []; // palabra de codigo con redundancia
    let RedundanceIndex = [];

    for (let i = 0; i <= B; i++) 
        RedundanceIndex[i] = 2**i;

    // Rellenar con -1 los lugares donde iran bits de control (redundantes)
    for (let i = 0, d = 0; i < N; i++) {
        if (RedundanceIndex.includes(i+1)) {
            WordCode[i] = -1;
        } else {
            WordCode[i] = WordCodeOriginal[d];
            d++;
        }
    }

    // algoritmo de codificacion de Hamming:
    // obtener los bits de cada indice
    let bin_indexs = Object.keys(WordCode)
                    .map(x => String(Number(x) + 1))
                    .map(x => parseInt(x).toString(2));
    let last = bin_indexs[bin_indexs.length - 1];                    

    for (let i = 0; i < bin_indexs.length; i++) {
        let n = last.length - bin_indexs[i].length;  
        bin_indexs[i] = '0'.repeat( n ) + bin_indexs[i];
    }

    let parity_bit = [];
    for (let i = 0; i < N; i++) {
        parity_bit.push( {parity: bin_indexs[i], bit: WordCode[i]} );
    }

    for (let i = 0; i < B; i++) {
        let p = parity_bit.filter(x => x.parity[x.parity.length-(i+1)] == '1');

        let bp = p.filter(x => x.bit == 1).length % 2 == 0 ? 0 : 1;

        WordCode[RedundanceIndex[i]-1] = bp;
    } 

    return [M, B, N, WordCode.map(value => String(value)).join('')];
}

function HammingDecode(Info) {
    // establecer parametros como M, B y N
    let params = SetParametersDecode(Info); 
    let WordCodeOriginal, M, B, N;

    [WordCodeOriginal, M, B, N] = params;

    // algoritmo de decodificacion de Hamming:
    let ErrPosition = ""; // valor binario de la posicion del error

    // obtener los bits de cada indice
    let bin_indexs = Object.keys(WordCodeOriginal)
                        .map(x => String(Number(x) + 1))
                        .map(x => parseInt(x).toString(2));
    let last = bin_indexs[bin_indexs.length - 1];                    
    for (let i = 0; i < bin_indexs.length; i++) {
        let n = last.length - bin_indexs[i].length;  
        bin_indexs[i] = '0'.repeat( n ) + bin_indexs[i];
    }

    let parity_bit = [];
    for (let i = 0; i < N; i++) {
        parity_bit.push( {parity: bin_indexs[i], bit: WordCodeOriginal[i]} );
    }

    for (let i = 0; i < B; i++) {
        let p = parity_bit.filter(x => x.parity[x.parity.length-(i+1)] == '1');

        let bp = p.filter(x => x.bit == 1).length % 2 == 0 ? '0' : '1';

        ErrPosition = bp + ErrPosition;
    }

    return [M, B, N, parseInt(ErrPosition, 2), ErrPosition];
}




// Acciones de eventos
function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"]
        .forEach(function(event) {
            textbox.addEventListener(event, function() {
                if (inputFilter(this.value)) {
                    this.oldValue = this.value;
                    this.oldSelectionStart = this.selectionStart;
                    this.oldSelectionEnd = this.selectionEnd;
                } else if (this.hasOwnProperty("oldValue")) {
                    this.value = this.oldValue;
                    this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
                } else {
                    this.value = "";
                }
            });
        });
}


