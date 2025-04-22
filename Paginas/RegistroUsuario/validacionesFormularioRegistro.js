export function validarNombre(nombre) {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    return regex.test(nombre);
  }
  
  export function validarApellido(apellido) {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    return regex.test(apellido);
  }
  
  export function validarRut(rut) {
    // Validar que el RUT tenga el formato correcto (con puntos y guion)
    const regex = /^[0-9]{1,2}(\.[0-9]{3}){2}-[0-9kK]$/;
  
    // Si no cumple con el formato, retorna falso
    if (!regex.test(rut)) {
      return false;
    }
  
    // Eliminar puntos y guion para validar solo los números y el dígito verificador
    const rutLimpio = rut.replace(/[.\-]/g, '');
  
    // Validar que el RUT tenga entre 8 y 9 dígitos más el dígito verificador
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return false;
    }
  
    return true;
  }
  
  export function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  export function validarCoincidenciaContraseñas(pass1, pass2) {
    return pass1 === pass2;
  }
  