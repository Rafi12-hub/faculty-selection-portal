/**
 * RGMCET Admission Numbers 2025 Batch (2nd Year B.Tech CSE)
 * Total: 377 Students (25091A0501 to 25091A05JN)
 */

const { db } = require('../src/config/database');
const bcrypt = require('bcryptjs');

const year2StudentsList = [
  // Page 1 (1 to 38)
  { sNo: 1, regNo: '25091A0501', name: 'ABDULLA SHAIK' },
  { sNo: 2, regNo: '25091A0502', name: 'ABHILASH K' },
  { sNo: 3, regNo: '25091A0503', name: 'ABHILASH NALLAGONDA' },
  { sNo: 4, regNo: '25091A0504', name: 'ABHINAY KUMAR REDDY ANKIREDDYPALLI' },
  { sNo: 5, regNo: '25091A0505', name: 'ABHISHEK ULAPU' },
  { sNo: 6, regNo: '25091A0506', name: 'ADITHYA PANETI' },
  { sNo: 7, regNo: '25091A0507', name: 'AFRID SYED' },
  { sNo: 8, regNo: '25091A0508', name: 'AJAI KUMAR BOGANI' },
  { sNo: 9, regNo: '25091A0509', name: 'AJAY KUMAR CHINTHAPARTHI' },
  { sNo: 10, regNo: '25091A0510', name: 'AJITH KUMAR REDDY SOORAPUREDDY' },
  { sNo: 11, regNo: '25091A0511', name: 'AKASH BABU THIMMAPURAM' },
  { sNo: 12, regNo: '25091A0512', name: 'AKASH YERUKULA' },
  { sNo: 13, regNo: '25091A0513', name: 'AKHIL MARRI' },
  { sNo: 14, regNo: '25091A0514', name: 'AKHIL MULLA' },
  { sNo: 15, regNo: '25091A0515', name: 'AKHILA GOLLA' },
  { sNo: 16, regNo: '25091A0516', name: 'ALEENA RAMEEN NALBAND' },
  { sNo: 17, regNo: '25091A0517', name: 'ALEKHYA CHELIMI' },
  { sNo: 18, regNo: '25091A0518', name: 'AMRUTHA GANGENENI' },
  { sNo: 19, regNo: '25091A0519', name: 'AMRUTHA RAMAVATH' },
  { sNo: 20, regNo: '25091A0520', name: 'AMRUTHA REDDY VYAPARLA' },
  { sNo: 21, regNo: '25091A0521', name: 'AMULYA MAMUDDU' },
  { sNo: 22, regNo: '25091A0522', name: 'ANIL KUMAR PALURU' },
  { sNo: 23, regNo: '25091A0523', name: 'ANUSHA BOJJA' },
  { sNo: 24, regNo: '25091A0524', name: 'ANUSHA SANDA' },
  { sNo: 25, regNo: '25091A0525', name: 'ARAVIND BARUGU' },
  { sNo: 26, regNo: '25091A0526', name: 'ARCCHITASREJA LATTAVARAMSURASETTY' },
  { sNo: 27, regNo: '25091A0527', name: 'ARCHANA GIRISHALA' },
  { sNo: 28, regNo: '25091A0528', name: 'ARSHIYA SHAIK' },
  { sNo: 29, regNo: '25091A0529', name: 'ASHMITHA PENUMALA' },
  { sNo: 30, regNo: '25091A0530', name: 'ASMITHA CHAKALI' },
  { sNo: 31, regNo: '25091A0531', name: 'ASWINI TALARI' },
  { sNo: 32, regNo: '25091A0532', name: 'ASWINI VELPULA' },
  { sNo: 33, regNo: '25091A0533', name: 'AYUB BASHA SHAIK' },
  { sNo: 34, regNo: '25091A0534', name: 'BABA AMRUDDIN SHAIK' },
  { sNo: 35, regNo: '25091A0535', name: 'BABU MUSOLLA' },
  { sNo: 36, regNo: '25091A0536', name: 'BALACHANDRA BOJJAPPAGARI' },
  { sNo: 37, regNo: '25091A0537', name: 'BHANU TEJA TUPAKULA' },
  { sNo: 38, regNo: '25091A0538', name: 'BHANUPRAKASH NEELAPALA' },

  // Page 2 (39 to 76)
  { sNo: 39, regNo: '25091A0539', name: 'BHANUTEJA MUDIRAJU' },
  { sNo: 40, regNo: '25091A0540', name: 'BHARATH KUMAR REDDY BODEDDULA' },
  { sNo: 41, regNo: '25091A0541', name: 'BHARGAVI GOPI' },
  { sNo: 42, regNo: '25091A0542', name: 'BHARGAVI PITTALA' },
  { sNo: 43, regNo: '25091A0543', name: 'BHAVANA MANTHRIGARU' },
  { sNo: 44, regNo: '25091A0544', name: 'BHAVYA SREE RAMI REDDY' },
  { sNo: 45, regNo: '25091A0545', name: 'BHUVANAKRUTHI BADA' },
  { sNo: 46, regNo: '25091A0546', name: 'CHANDANA PATIL' },
  { sNo: 47, regNo: '25091A0547', name: 'CHANDRA SEKHAR KOPPERA' },
  { sNo: 48, regNo: '25091A0548', name: 'CHANDU PUJARI' },
  { sNo: 49, regNo: '25091A0549', name: 'CHARAN KUMAR REDDY MANDADI' },
  { sNo: 50, regNo: '25091A0550', name: 'CHARANYYA POTHUBOIENA' },
  { sNo: 51, regNo: '25091A0551', name: 'CHARISHMA KARAPAKULA' },
  { sNo: 52, regNo: '25091A0552', name: 'CHENNA SAI DEEKSHITHA GANGARAPU' },
  { sNo: 53, regNo: '25091A0553', name: 'DATTA SAI GAJJALA' },
  { sNo: 54, regNo: '25091A0554', name: 'DEEKSHITH SAI CHANDRA' },
  { sNo: 55, regNo: '25091A0555', name: 'DEEKSHITHA CHIPPAGIRI' },
  { sNo: 56, regNo: '25091A0556', name: 'DEEKSHITHA YADALAM' },
  { sNo: 57, regNo: '25091A0557', name: 'DEEPAK LINGALA' },
  { sNo: 58, regNo: '25091A0558', name: 'DEEPIKA AKULA' },
  { sNo: 59, regNo: '25091A0559', name: 'DEEPIKA JUTURU' },
  { sNo: 60, regNo: '25091A0560', name: 'DEVA NANDINI GULLADURTHI' },
  { sNo: 61, regNo: '25091A0561', name: 'DEVENDRA KURUVA' },
  { sNo: 62, regNo: '25091A0562', name: 'DHEDEEPYA YADIKI' },
  { sNo: 63, regNo: '25091A0563', name: 'DINAKAR PILLI' },
  { sNo: 64, regNo: '25091A0564', name: 'DINESH REDDY BANDI' },
  { sNo: 65, regNo: '25091A0565', name: 'DIVYA ASHISH RITHVIK PULADAS' },
  { sNo: 66, regNo: '25091A0566', name: 'DIVYA SREE PALISETTY' },
  { sNo: 67, regNo: '25091A0567', name: 'DIVYA SRI VALLAPU REDDY' },
  { sNo: 68, regNo: '25091A0568', name: 'DORABABU NAGARI' },
  { sNo: 69, regNo: '25091A0569', name: 'DURGA PRASAD GORANTLA' },
  { sNo: 70, regNo: '25091A0570', name: 'EPHRATHA WESLY VELUGOTY' },
  { sNo: 71, regNo: '25091A0571', name: 'ESHA KURUVA' },
  { sNo: 72, regNo: '25091A0572', name: 'FAREED PINJARI' },
  { sNo: 73, regNo: '25091A0573', name: 'FARHEEN SHAIK' },
  { sNo: 74, regNo: '25091A0574', name: 'GANESH JAGGALLAGARI' },
  { sNo: 75, regNo: '25091A0575', name: 'GANESH KUMAR REDDY DESHIREDDY' },
  { sNo: 76, regNo: '25091A0576', name: 'GANGA KOWSHIK KUMAR VELPULA' },

  // Page 3 (77 to 114)
  { sNo: 77, regNo: '25091A0577', name: 'GAYATHRI ANKE' },
  { sNo: 78, regNo: '25091A0578', name: 'GAYATHRI BATTALA' },
  { sNo: 79, regNo: '25091A0579', name: 'GEETHANJALI GOLLA' },
  { sNo: 80, regNo: '25091A0580', name: 'GEETHANJALI RAMISETTY' },
  { sNo: 81, regNo: '25091A0581', name: 'GIRISHA METTUPALLI' },
  { sNo: 82, regNo: '25091A0582', name: 'GNANA SAI CHARAN DASARI' },
  { sNo: 83, regNo: '25091A0583', name: 'GOUTHAM UPPARI' },
  { sNo: 84, regNo: '25091A0584', name: 'GOWTHAM GAMBHEER KOTHAPALLE' },
  { sNo: 85, regNo: '25091A0585', name: 'GOWTHAMI NAGALLA' },
  { sNo: 86, regNo: '25091A0586', name: 'GREESHMANTH KUMAR REDDY LOMADA' },
  { sNo: 87, regNo: '25091A0587', name: 'GURU PALLAVI BADVEL' },
  { sNo: 88, regNo: '25091A0588', name: 'GURUHEMA DASARI' },
  { sNo: 89, regNo: '25091A0589', name: 'GURULAHARI TALARI' },
  { sNo: 90, regNo: '25091A0590', name: 'HABEEBA SAYYED' },
  { sNo: 91, regNo: '25091A0591', name: 'HARI KRISHNA VALAMPATI' },
  { sNo: 92, regNo: '25091A0592', name: 'HARI KUMAR KURUBA' },
  { sNo: 93, regNo: '25091A0593', name: 'HARI NANDINI SAGADONA' },
  { sNo: 94, regNo: '25091A0594', name: 'HARISH G' },
  { sNo: 95, regNo: '25091A0595', name: 'HARISH RAJULA' },
  { sNo: 96, regNo: '25091A0596', name: 'HARSHAD BABU SYED RAJAMMAGARI' },
  { sNo: 97, regNo: '25091A0597', name: 'HARSHAVARDHAN BABU DARSHANABOYINA' },
  { sNo: 98, regNo: '25091A0598', name: 'HARSHAVARDHAN CHUKKALURU' },
  { sNo: 99, regNo: '25091A0599', name: 'HASINI MARRI' },
  { sNo: 100, regNo: '25091A05A0', name: 'HEMANTH KUMAR REDDY SIDDAMREDDY' },
  { sNo: 101, regNo: '25091A05A1', name: 'HEMANTH REDDY MALLU' },
  { sNo: 102, regNo: '25091A05A2', name: 'HIRANYA J' },
  { sNo: 103, regNo: '25091A05A3', name: 'INDU BOMMINENI' },
  { sNo: 104, regNo: '25091A05A4', name: 'IRFAN FARHAD KHAN P' },
  { sNo: 105, regNo: '25091A05A5', name: 'IRFANA PINJARI' },
  { sNo: 106, regNo: '25091A05A6', name: 'JAGAN MOHAN ROYAL SITHAKA' },
  { sNo: 107, regNo: '25091A05A7', name: 'JAHNAVI CHAVITI HANUMAPPA GARI' },
  { sNo: 108, regNo: '25091A05A8', name: 'JANARDHAN CHITLURU' },
  { sNo: 109, regNo: '25091A05A9', name: 'JANI BASHA D' },
  { sNo: 110, regNo: '25091A05AA', name: 'JASHNAVI SANGA' },
  { sNo: 111, regNo: '25091A05AB', name: 'JASHWANTH GOLLA' },
  { sNo: 112, regNo: '25091A05AC', name: 'JASWANTH MANDLA' },
  { sNo: 113, regNo: '25091A05AD', name: 'JASWANTH REDDY GANDURI' },
  { sNo: 114, regNo: '25091A05AE', name: 'JAYA SRI BUDAGAVI MATAM' },

  // Page 4 (115 to 152)
  { sNo: 115, regNo: '25091A05AF', name: 'JAYAVARDHAN NANDIPATI' },
  { sNo: 116, regNo: '25091A05AG', name: 'JEELAN BABA MITAI' },
  { sNo: 117, regNo: '25091A05AH', name: 'JEEVAN P' },
  { sNo: 118, regNo: '25091A05AJ', name: 'JEEVAN PRAKASH AKULA' },
  { sNo: 119, regNo: '25091A05AK', name: 'JESIKA SANA' },
  { sNo: 120, regNo: '25091A05AM', name: 'JETENDRA SANA' },
  { sNo: 121, regNo: '25091A05AN', name: 'JILANI SHAIK' },
  { sNo: 122, regNo: '25091A05AP', name: 'JITENDRA GOUD MALI PATIL' },
  { sNo: 123, regNo: '25091A05AQ', name: 'JUBER SHAIK' },
  { sNo: 124, regNo: '25091A05AR', name: 'JYOSHNA NALLABOLU' },
  { sNo: 125, regNo: '25091A05AS', name: 'JYOTHI KEERTHANA C' },
  { sNo: 126, regNo: '25091A05AT', name: 'JYOTHIRMAYEE NANDIVARGAM' },
  { sNo: 127, regNo: '25091A05AU', name: 'KALPANA TAKKALA PALLI' },
  { sNo: 128, regNo: '25091A05AV', name: 'KARIMULLA SYED' },
  { sNo: 129, regNo: '25091A05AW', name: 'KARTHEEK NAIK MOOD' },
  { sNo: 130, regNo: '25091A05AX', name: 'KARTHIK RAJU RAMPALLI' },
  { sNo: 131, regNo: '25091A05AY', name: 'KAVYA SREE GOGULA' },
  { sNo: 132, regNo: '25091A05B0', name: 'KEERTHANA CHAGALETI' },
  { sNo: 133, regNo: '25091A05B1', name: 'KEERTHANA REDDY OBULREDDY' },
  { sNo: 134, regNo: '25091A05B2', name: 'KEERTHI PRIYA MADDIKERA' },
  { sNo: 135, regNo: '25091A05B3', name: 'KHADARVALI DUDEKULA' },
  { sNo: 136, regNo: '25091A05B4', name: 'KIRAN MODAPURI' },
  { sNo: 137, regNo: '25091A05B5', name: 'KISHAN KUMAR GOLLA' },
  { sNo: 138, regNo: '25091A05B6', name: 'KONDA REDDY CHILEKAMPALLI' },
  { sNo: 139, regNo: '25091A05B7', name: 'KOUSHIK KOLLIPARA' },
  { sNo: 140, regNo: '25091A05B8', name: 'KUMAR REPALLE' },
  { sNo: 141, regNo: '25091A05B9', name: 'KUSIMI BAI MUDE' },
  { sNo: 142, regNo: '25091A05BA', name: 'LAKSHMI PRASANNA SAKE' },
  { sNo: 143, regNo: '25091A05BB', name: 'LAKSHMI REDDY BOYA' },
  { sNo: 144, regNo: '25091A05BC', name: 'LATHA INTI' },
  { sNo: 145, regNo: '25091A05BD', name: 'LIKHITH REDDY GANGULA' },
  { sNo: 146, regNo: '25091A05BE', name: 'LIKHITHA GAJULAPALLI' },
  { sNo: 147, regNo: '25091A05BF', name: 'LIKHITHA MARATI' },
  { sNo: 148, regNo: '25091A05BG', name: 'LOKESH RAYASAM' },
  { sNo: 149, regNo: '25091A05BH', name: 'MADHAN MACHUPALLI' },
  { sNo: 150, regNo: '25091A05BJ', name: 'MAHA LAKSHMI PALLAPU' },
  { sNo: 151, regNo: '25091A05BK', name: 'MAHAMMAD GAGGUTURU' },
  { sNo: 152, regNo: '25091A05BM', name: 'MAHAMMAD HAROON SHAIK' },

  // Page 5 (153 to 190)
  { sNo: 153, regNo: '25091A05BN', name: 'MAHAMMAD HUZUR SHAIK' },
  { sNo: 154, regNo: '25091A05BP', name: 'MAHAMMAD JAKEER SHAIK' },
  { sNo: 155, regNo: '25091A05BQ', name: 'MAHAMMAD SAMEER SHAIK' },
  { sNo: 156, regNo: '25091A05BR', name: 'MAHAMMAD VASIF KALAGOTLA' },
  { sNo: 157, regNo: '25091A05BS', name: 'MAHAMMAD YOUNUS ATCHUKATLA' },
  { sNo: 158, regNo: '25091A05BT', name: 'MAHEETH ANTHONY' },
  { sNo: 159, regNo: '25091A05BU', name: 'MANASA PAPPURATHI' },
  { sNo: 160, regNo: '25091A05BV', name: 'MANEESHA BAALAGAANI' },
  { sNo: 161, regNo: '25091A05BW', name: 'MANEESHA CHILAKAM' },
  { sNo: 162, regNo: '25091A05BX', name: 'MANEESHA SENAGALA KURUBA' },
  { sNo: 163, regNo: '25091A05BY', name: 'MANI DEEPIKA BATCHU' },
  { sNo: 164, regNo: '25091A05C0', name: 'MANI PUJITHA PALLE' },
  { sNo: 165, regNo: '25091A05C1', name: 'MANI SHANKAR VADLA' },
  { sNo: 166, regNo: '25091A05C2', name: 'MANJUNADHA REDDY PERLA' },
  { sNo: 167, regNo: '25091A05C3', name: 'MANJUNATH REDDY YERASI' },
  { sNo: 168, regNo: '25091A05C4', name: 'MANOOSHA PULLAGURAVALLA' },
  { sNo: 169, regNo: '25091A05C5', name: 'MANSOOR BASHA BIKARIGALLA' },
  { sNo: 170, regNo: '25091A05C6', name: 'MANUSRI YENUMULA' },
  { sNo: 171, regNo: '25091A05C7', name: 'MISBHA TARANNUM POST' },
  { sNo: 172, regNo: '25091A05C8', name: 'MODEM PAKKIRIGALLA DARSHAN KUMAR' },
  { sNo: 173, regNo: '25091A05C9', name: 'MOHAMMAD FAHAD SHAIK' },
  { sNo: 174, regNo: '25091A05CA', name: 'MOHAMMAD KHALID NETHIBOTTU' },
  { sNo: 175, regNo: '25091A05CB', name: 'MOHAMMED BABA FAKRUDDIN SHAIK' },
  { sNo: 176, regNo: '25091A05CC', name: 'MOHAMMED IMTIYAZ SHAIK' },
  { sNo: 177, regNo: '25091A05CD', name: 'MOHAMMED REHAN SHAIK' },
  { sNo: 178, regNo: '25091A05CE', name: 'MOHAMMED RIHAN KHAN PATHAN' },
  { sNo: 179, regNo: '25091A05CF', name: 'MOHAMMED SOHAIF BASHA SHAIK' },
  { sNo: 180, regNo: '25091A05CG', name: 'MOHAN KRISHNA MANGALI' },
  { sNo: 181, regNo: '25091A05CH', name: 'MOKSHITH SAI KUMAR REDDY SEELLA' },
  { sNo: 182, regNo: '25091A05CJ', name: 'MOKSHITH SHIVA KURUMU' },
  { sNo: 183, regNo: '25091A05CK', name: 'MOUNI PUTHA' },
  { sNo: 184, regNo: '25091A05CM', name: 'MOUNIKA GURRAM' },
  { sNo: 185, regNo: '25091A05CN', name: 'MOUNIKA LAMBU' },
  { sNo: 186, regNo: '25091A05CP', name: 'MUBINA BEE BONGU' },
  { sNo: 187, regNo: '25091A05CQ', name: 'MURALIDHAR REDDY MULINTI' },
  { sNo: 188, regNo: '25091A05CR', name: 'NAGA AKHILA K' },
  { sNo: 189, regNo: '25091A05CS', name: 'NAGA CHARATH MADASI KURUVA' },
  { sNo: 190, regNo: '25091A05CT', name: 'NAGA PRIYA BAREDDY' },

  // Page 6 (191 to 228)
  { sNo: 191, regNo: '25091A05CU', name: 'NAGA SAI VENNELA MALLU' },
  { sNo: 192, regNo: '25091A05CV', name: 'NAGA SIVA KARTHIK PULLIRUPU' },
  { sNo: 193, regNo: '25091A05CW', name: 'NAGA YASHWANTH SAI MIDDE' },
  { sNo: 194, regNo: '25091A05CX', name: 'NAGABABU MALAPATI' },
  { sNo: 195, regNo: '25091A05CY', name: 'NAGAKARTHIKEYA REDDY SINGIREDDY' },
  { sNo: 196, regNo: '25091A05D0', name: 'NAJIYA PAGIDALA' },
  { sNo: 197, regNo: '25091A05D1', name: 'NANDA KUMAR REDDY KANASANI' },
  { sNo: 198, regNo: '25091A05D2', name: 'NANDAKISHORE ATTEKANTI' },
  { sNo: 199, regNo: '25091A05D3', name: 'NANDAVARDHAN MAMILLAPALLI' },
  { sNo: 200, regNo: '25091A05D4', name: 'NANDINI MADDIKERI' },
  { sNo: 201, regNo: '25091A05D5', name: 'NANDINI SINGARAJUPALLE' },
  { sNo: 202, regNo: '25091A05D6', name: 'NANDINI SOMALA' },
  { sNo: 203, regNo: '25091A05D7', name: 'NARASIMHUDU THOKALA' },
  { sNo: 204, regNo: '25091A05D8', name: 'NARENDRA JAGATI' },
  { sNo: 205, regNo: '25091A05D9', name: 'NARESH DESANI' },
  { sNo: 206, regNo: '25091A05DA', name: 'NAVAMANI RUPA KONDA' },
  { sNo: 207, regNo: '25091A05DB', name: 'NAVANEESWAR REDDY NIMMAKAYALA' },
  { sNo: 208, regNo: '25091A05DC', name: 'NAVANEETHA K' },
  { sNo: 209, regNo: '25091A05DD', name: 'NAVYA NANUBALA' },
  { sNo: 210, regNo: '25091A05DE', name: 'NAVYA SREE DODDA THAMMANNAGARI' },
  { sNo: 211, regNo: '25091A05DF', name: 'NAVYA SRI PITTU' },
  { sNo: 212, regNo: '25091A05DG', name: 'NEERAJA AVULA' },
  { sNo: 213, regNo: '25091A05DH', name: 'NEERAJA CHARUKONDA' },
  { sNo: 214, regNo: '25091A05DJ', name: 'NEETHU C' },
  { sNo: 215, regNo: '25091A05DK', name: 'NIKHILA KOMMAROLU' },
  { sNo: 216, regNo: '25091A05DM', name: 'NIRMALA MEENUGA' },
  { sNo: 217, regNo: '25091A05DN', name: 'NOORUL BASHA SHAIK' },
  { sNo: 218, regNo: '25091A05DP', name: 'PADMAJA SAKE' },
  { sNo: 219, regNo: '25091A05DQ', name: 'PALLAVI SAKE' },
  { sNo: 220, regNo: '25091A05DR', name: 'PARVEZ ALAM M' },
  { sNo: 221, regNo: '25091A05DS', name: 'PAVAN KUMAR REDDY YANAMALA' },
  { sNo: 222, regNo: '25091A05DT', name: 'PAVITRA POLA' },
  { sNo: 223, regNo: '25091A05DU', name: 'POOJITHA MANENI' },
  { sNo: 224, regNo: '25091A05DV', name: 'POOJITHA POTTAKARLA' },
  { sNo: 225, regNo: '25091A05DW', name: 'POORNA SAI ADARSH SUNKU' },
  { sNo: 226, regNo: '25091A05DX', name: 'PRADEEP BADIGE' },
  { sNo: 227, regNo: '25091A05DY', name: 'PRANAY AJJE' },
  { sNo: 228, regNo: '25091A05E0', name: 'PRANEETHA YENUMULAPALLI' },

  // Page 7 (229 to 266)
  { sNo: 229, regNo: '25091A05E1', name: 'PRASANNA KUMAR GALANKI' },
  { sNo: 230, regNo: '25091A05E2', name: 'PRASHANTH KUMAR GADDA' },
  { sNo: 231, regNo: '25091A05E3', name: 'PREMANVITHA DADITHOTA' },
  { sNo: 232, regNo: '25091A05E4', name: 'PREMKUMAR SAPPOGU' },
  { sNo: 233, regNo: '25091A05E5', name: 'PUJA SREE BOMMINENI' },
  { sNo: 234, regNo: '25091A05E6', name: 'PUJITHA KOTAPATI' },
  { sNo: 235, regNo: '25091A05E7', name: 'PUJITHA MALLIREDDY' },
  { sNo: 236, regNo: '25091A05E8', name: 'PUJITHA REDDY PADIGI' },
  { sNo: 237, regNo: '25091A05E9', name: 'RADHIKA PERUMALLA' },
  { sNo: 238, regNo: '25091A05EA', name: 'RAGHAVENDRA CHALLAM' },
  { sNo: 239, regNo: '25091A05EB', name: 'RAGHUNATHA RAO MODA' },
  { sNo: 240, regNo: '25091A05EC', name: 'RAHAMAN TANGUTURU' },
  { sNo: 241, regNo: '25091A05ED', name: 'RAHIM BABU GUDURU' },
  { sNo: 242, regNo: '25091A05EE', name: 'RAHITHYA LAKSHMI SAGALA' },
  { sNo: 243, regNo: '25091A05EF', name: 'RAJ KUMAR GINKALA' },
  { sNo: 244, regNo: '25091A05EG', name: 'RAJANI LAKKIREDDY' },
  { sNo: 245, regNo: '25091A05EH', name: 'RAJESH BODAGALA' },
  { sNo: 246, regNo: '25091A05EJ', name: 'RAJESH GOULA' },
  { sNo: 247, regNo: '25091A05EK', name: 'RAKESH BAIRI' },
  { sNo: 248, regNo: '25091A05EM', name: 'RAKSHITHA GALI' },
  { sNo: 249, regNo: '25091A05EN', name: 'RAVI TEJA KURUVA' },
  { sNo: 250, regNo: '25091A05EP', name: 'REDDYKUMARI SANEPALLI' },
  { sNo: 251, regNo: '25091A05EQ', name: 'RENUKA YERRAGUNTLA' },
  { sNo: 252, regNo: '25091A05ER', name: 'REVATHI THADIMARRI' },
  { sNo: 253, regNo: '25091A05ES', name: 'RISHALINI DUDEKULA' },
  { sNo: 254, regNo: '25091A05ET', name: 'RISHITHA NAGARURI' },
  { sNo: 255, regNo: '25091A05EU', name: 'RUCHITHA CHAPATI' },
  { sNo: 256, regNo: '25091A05EV', name: 'SAHITHI CHINNAPOLU' },
  { sNo: 257, regNo: '25091A05EW', name: 'SAHITHI DUDEKULA' },
  { sNo: 258, regNo: '25091A05EX', name: 'SAHITHI PERAM' },
  { sNo: 259, regNo: '25091A05EY', name: 'SAI CHARITHA BIJJAM' },
  { sNo: 260, regNo: '25091A05F0', name: 'SAI IRIKIREDDY' },
  { sNo: 261, regNo: '25091A05F1', name: 'SAI KRISHNA ADIVAPPAGARI' },
  { sNo: 262, regNo: '25091A05F2', name: 'SAI KRUTHIKA KRISHNAMANNAGARI' },
  { sNo: 263, regNo: '25091A05F3', name: 'SAI KUMAR REDDY BASIREDDY' },
  { sNo: 264, regNo: '25091A05F4', name: 'SAI PRIYA V' },
  { sNo: 265, regNo: '25091A05F5', name: 'SAI SAMITH YEGISETTY' },
  { sNo: 266, regNo: '25091A05F6', name: 'SAI SHANKAR REDDY GANNE' },

  // Page 8 (267 to 304)
  { sNo: 267, regNo: '25091A05F7', name: 'SAI SHIREESHA VANAM' },
  { sNo: 268, regNo: '25091A05F8', name: 'SAI SRUTHIKA GUDALA' },
  { sNo: 269, regNo: '25091A05F9', name: 'SAI TEJASWAINI NAGELLA' },
  { sNo: 270, regNo: '25091A05FA', name: 'SAI VARSHITHA GINKALA' },
  { sNo: 271, regNo: '25091A05FB', name: 'SAI VENKATA TEJA KAMALAPURI' },
  { sNo: 272, regNo: '25091A05FC', name: 'SAINATH RAACHAMADUGU' },
  { sNo: 273, regNo: '25091A05FD', name: 'SAIRAM CHAKALI' },
  { sNo: 274, regNo: '25091A05FE', name: 'SAMEER HUSSAIN MOMIN' },
  { sNo: 275, regNo: '25091A05FF', name: 'SAMEERA DUDEKULA' },
  { sNo: 276, regNo: '25091A05FG', name: 'SAMUEL BABU EDURI' },
  { sNo: 277, regNo: '25091A05FH', name: 'SANIYA SHAIK' },
  { sNo: 278, regNo: '25091A05FJ', name: 'SANJAY PADIGERI' },
  { sNo: 279, regNo: '25091A05FK', name: 'SANJEEVA NAIK GARI MOTHILAL NAIK' },
  { sNo: 280, regNo: '25091A05FM', name: 'SANTHI SWAROOPARANI SREEDHARLA' },
  { sNo: 281, regNo: '25091A05FN', name: 'SANTHOSH SATRY' },
  { sNo: 282, regNo: '25091A05FP', name: 'SATHWIKA SAKE' },
  { sNo: 283, regNo: '25091A05FQ', name: 'SAZID PATAN' },
  { sNo: 284, regNo: '25091A05FR', name: 'SEBHILASH YADAV JAKKULA' },
  { sNo: 285, regNo: '25091A05FS', name: 'SHAFIA SHABNAM SHAIK' },
  { sNo: 286, regNo: '25091A05FT', name: 'SHAHEENA TABASUM SHAIK' },
  { sNo: 287, regNo: '25091A05FU', name: 'SHALINI SUDHESHNA GADDAM' },
  { sNo: 288, regNo: '25091A05FV', name: 'SHARATH CHANDRA GOUD J' },
  { sNo: 289, regNo: '25091A05FW', name: 'SHASI KUMAR SANNAPENNAPPAGARI' },
  { sNo: 290, regNo: '25091A05FX', name: 'SHYAM SUCHARITHA KUDUMULA' },
  { sNo: 291, regNo: '25091A05FY', name: 'SIDDU MALA' },
  { sNo: 292, regNo: '25091A05G0', name: 'SIMHADRI ANKE' },
  { sNo: 293, regNo: '25091A05G1', name: 'SIRI DASARI' },
  { sNo: 294, regNo: '25091A05G2', name: 'SIVA KUMAR DUDDEKUNTA' },
  { sNo: 295, regNo: '25091A05G3', name: 'SIVA POOJITHA ARIGELA' },
  { sNo: 296, regNo: '25091A05G4', name: 'SIVA RAMAPRASAD CHAGALAMARRI' },
  { sNo: 297, regNo: '25091A05G5', name: 'SIVA SAI HARSHA PONNURU' },
  { sNo: 298, regNo: '25091A05G6', name: 'SIVA SAI SIDHARTHA GUDDETI' },
  { sNo: 299, regNo: '25091A05G7', name: 'SIVA SAINATH GUDDETI' },
  { sNo: 300, regNo: '25091A05G8', name: 'SNEHA K' },
  { sNo: 301, regNo: '25091A05G9', name: 'SNEHA LATHA CHARMALA' },
  { sNo: 302, regNo: '25091A05GA', name: 'SNEHA YADIKI' },
  { sNo: 303, regNo: '25091A05GB', name: 'SNEHALATHA REDDY BOMMAREDDY' },
  { sNo: 304, regNo: '25091A05GC', name: 'SNEHALATHA VELURI' },

  // Page 9 (305 to 342)
  { sNo: 305, regNo: '25091A05GD', name: 'SNEHITHA THIRUPATI' },
  { sNo: 306, regNo: '25091A05GE', name: 'SOWJANYA JAKKULA' },
  { sNo: 307, regNo: '25091A05GF', name: 'SPANDANA B' },
  { sNo: 308, regNo: '25091A05GG', name: 'SPURTHI GOGULA' },
  { sNo: 309, regNo: '25091A05GH', name: 'SRAVAN KUMAR REDDY PEDDI REDDY' },
  { sNo: 310, regNo: '25091A05GJ', name: 'SREE DEEKSHITA CHIMMANI' },
  { sNo: 311, regNo: '25091A05GK', name: 'SREEJA KORA' },
  { sNo: 312, regNo: '25091A05GM', name: 'SRI HARI SAI SHARAN PETLA' },
  { sNo: 313, regNo: '25091A05GN', name: 'SRI PRANAV BESTHA' },
  { sNo: 314, regNo: '25091A05GP', name: 'SRINATH MADDURU' },
  { sNo: 315, regNo: '25091A05GQ', name: 'SRINIVASA CHARAN BOYA' },
  { sNo: 316, regNo: '25091A05GR', name: 'SRINIVASULU YERUKULA' },
  { sNo: 317, regNo: '25091A05GS', name: 'SRUJAN VELPULA' },
  { sNo: 318, regNo: '25091A05GT', name: 'STHUTHI SAPPOGU' },
  { sNo: 319, regNo: '25091A05GU', name: 'SUBBALATHA SANAM' },
  { sNo: 320, regNo: '25091A05GV', name: 'SUBBARAYUDU YERUKALI' },
  { sNo: 321, regNo: '25091A05GW', name: 'SUHRITHA M V S' },
  { sNo: 322, regNo: '25091A05GX', name: 'SUJATHA GYARA' },
  { sNo: 323, regNo: '25091A05GY', name: 'SUMANTH GOUD EDIGA' },
  { sNo: 324, regNo: '25091A05H0', name: 'SUMANTH PULI' },
  { sNo: 325, regNo: '25091A05H1', name: 'SURENDRA PANDIPADU' },
  { sNo: 326, regNo: '25091A05H2', name: 'SUSHMA SANGALA' },
  { sNo: 327, regNo: '25091A05H3', name: 'SUSMANTH MEKA' },
  { sNo: 328, regNo: '25091A05H4', name: 'SWETHA SREE PALLAPATI REDDY' },
  { sNo: 329, regNo: '25091A05H5', name: 'TEJA KIRAN CHENNA' },
  { sNo: 330, regNo: '25091A05H6', name: 'THANUJA A' },
  { sNo: 331, regNo: '25091A05H7', name: 'THISHANTH REDDY ILLURU' },
  { sNo: 332, regNo: '25091A05H8', name: 'THULASI GOSI' },
  { sNo: 333, regNo: '25091A05H9', name: 'THULASI VATTEM' },
  { sNo: 334, regNo: '25091A05HA', name: 'UMESH CHOWDAM' },
  { sNo: 335, regNo: '25091A05HB', name: 'UMESH NAIK MUDE' },
  { sNo: 336, regNo: '25091A05HC', name: 'USHA JUTURU' },
  { sNo: 337, regNo: '25091A05HD', name: 'VAISHNAVI PILLELLA' },
  { sNo: 338, regNo: '25091A05HE', name: 'VAMSHI K' },
  { sNo: 339, regNo: '25091A05HF', name: 'VAMSI KRISHNA REDDY TAPPETA' },
  { sNo: 340, regNo: '25091A05HG', name: 'VAMSI NALLABOTHULA' },
  { sNo: 341, regNo: '25091A05HH', name: 'VANDANA PANDIBOTU' },
  { sNo: 342, regNo: '25091A05HJ', name: 'VARSHITH YUVARAJ P' },

  // Page 10 (343 to 377)
  { sNo: 343, regNo: '25091A05HK', name: 'VARUN KUMAR CHINDULA' },
  { sNo: 344, regNo: '25091A05HM', name: 'VARUN TEJA NAIK NENAVATH' },
  { sNo: 345, regNo: '25091A05HN', name: 'VEDHA SREE MANGALI' },
  { sNo: 346, regNo: '25091A05HP', name: 'VEENA RAHITYA POTARAJU' },
  { sNo: 347, regNo: '25091A05HQ', name: 'VEERENDRA GADAMURI' },
  { sNo: 348, regNo: '25091A05HR', name: 'VENKATA CHARITHA REDDY BOMMIREDDY' },
  { sNo: 349, regNo: '25091A05HS', name: 'VENKATA GNANA VARUN KUMAR REDDY BORRA' },
  { sNo: 350, regNo: '25091A05HT', name: 'VENKATA GURU PRASAD REDDY VADDEMPURI' },
  { sNo: 351, regNo: '25091A05HU', name: 'VENKATA KRISHNA MANASWINI MUNGARA' },
  { sNo: 352, regNo: '25091A05HV', name: 'VENKATA KRISHNA SUMADHAR MAHANKALI' },
  { sNo: 353, regNo: '25091A05HW', name: 'VENKATA MAHALAKSHMI SAMPANGI' },
  { sNo: 354, regNo: '25091A05HX', name: 'VENKATA SUBBAIAH GANTA' },
  { sNo: 355, regNo: '25091A05HY', name: 'VENKATA SUBRAMANYAM GHADIYARAM' },
  { sNo: 356, regNo: '25091A05J0', name: 'VENKATA SURENDRA MEESALA' },
  { sNo: 357, regNo: '25091A05J1', name: 'VENKATA VIMALA RASIPOYINA' },
  { sNo: 358, regNo: '25091A05J2', name: 'VENNALA ADLIGI' },
  { sNo: 359, regNo: '25091A05J3', name: 'VENNELA ANNALADASULA' },
  { sNo: 360, regNo: '25091A05J4', name: 'VENUGOPAL KURUVA' },
  { sNo: 361, regNo: '25091A05J5', name: 'VINAY KUMAR MURAHARI' },
  { sNo: 362, regNo: '25091A05J6', name: 'VINAY KUMAR REDDY SINGAMALA' },
  { sNo: 363, regNo: '25091A05J7', name: 'VISHNU VARDHAN AVULA' },
  { sNo: 364, regNo: '25091A05J8', name: 'VISHNU VARDHAN KALLADI' },
  { sNo: 365, regNo: '25091A05J9', name: 'VISHNUVARDHAN SAKE' },
  { sNo: 366, regNo: '25091A05JA', name: 'VISHWANATH BOYA' },
  { sNo: 367, regNo: '25091A05JB', name: 'VYSHNAVI SOORAPUREDDY' },
  { sNo: 368, regNo: '25091A05JC', name: 'YASHASWINI SONTAM' },
  { sNo: 369, regNo: '25091A05JD', name: 'YASHASWINI YB' },
  { sNo: 370, regNo: '25091A05JE', name: 'YASHVITHA VADLA' },
  { sNo: 371, regNo: '25091A05JF', name: 'YASIN BABU RUPANAGUDI' },
  { sNo: 372, regNo: '25091A05JG', name: 'YASIN SHAIK' },
  { sNo: 373, regNo: '25091A05JH', name: 'YASWANTH MALA' },
  { sNo: 374, regNo: '25091A05JJ', name: 'YASWANTH UMMANAMYNA' },
  { sNo: 375, regNo: '25091A05JK', name: 'YESWANTHI SOMA' },
  { sNo: 376, regNo: '25091A05JM', name: 'YUGANDHAR REDDY TANGUTURI' },
  { sNo: 377, regNo: '25091A05JN', name: 'ZOYA SHAIK MALIGE' },

  // Lateral Entry - 2nd Year Group B (378 to 421)
  { sNo: 378, regNo: '26095A0501', name: 'AKSHAY KUMAR V' },
  { sNo: 379, regNo: '26095A0502', name: 'ANAND G' },
  { sNo: 380, regNo: '26095A0503', name: 'ARAVIND K' },
  { sNo: 381, regNo: '26095A0504', name: 'ARTHI K' },
  { sNo: 382, regNo: '26095A0505', name: 'BHAVANI N' },
  { sNo: 383, regNo: '26095A0506', name: 'BHAVANI SANKAR B' },
  { sNo: 384, regNo: '26095A0507', name: 'CHANDRA DHARANI M' },
  { sNo: 385, regNo: '26095A0508', name: 'CHANDU N' },
  { sNo: 386, regNo: '26095A0509', name: 'DHANESH REDDY D' },
  { sNo: 387, regNo: '26095A0510', name: 'ESWARA YASWANTH REDDY C' },
  { sNo: 388, regNo: '26095A0511', name: 'GOUTHAM E' },
  { sNo: 389, regNo: '26095A0512', name: 'HARI SEKHAR K' },
  { sNo: 390, regNo: '26095A0513', name: 'HEMANTH KUMAR K' },
  { sNo: 391, regNo: '26095A0514', name: 'HITHESH G' },
  { sNo: 392, regNo: '26095A0515', name: 'JASWANTH KUMAR GOUD K' },
  { sNo: 393, regNo: '26095A0516', name: 'KRISHNA KUMAR REDDY S' },
  { sNo: 394, regNo: '26095A0517', name: 'KUSUMA VARDHINI C' },
  { sNo: 395, regNo: '26095A0518', name: 'LAKSHMI PRASANNA A' },
  { sNo: 396, regNo: '26095A0519', name: 'LAKSHMI RAMANA Y' },
  { sNo: 397, regNo: '26095A0520', name: 'MAHESH BABU B' },
  { sNo: 398, regNo: '26095A0521', name: 'MAHESWARI S' },
  { sNo: 399, regNo: '26095A0522', name: 'MANIDEEP REDDY K' },
  { sNo: 400, regNo: '26095A0523', name: 'MOHAMMAD HUSSAIN BASHA G' },
  { sNo: 401, regNo: '26095A0524', name: 'MUNI ROOPA B' },
  { sNo: 402, regNo: '26095A0525', name: 'NAGA YESWANTH B' },
  { sNo: 403, regNo: '26095A0526', name: 'NARESH NAIDU P' },
  { sNo: 404, regNo: '26095A0527', name: 'RAHIMUNNISA S' },
  { sNo: 405, regNo: '26095A0528', name: 'RAJA PREM DEV D' },
  { sNo: 406, regNo: '26095A0529', name: 'SAI MANOJ B' },
  { sNo: 407, regNo: '26095A0530', name: 'SAMBASIVA REDDY Y' },
  { sNo: 408, regNo: '26095A0531', name: 'SANTHOSH K' },
  { sNo: 409, regNo: '26095A0532', name: 'SASI VARDHAN P' },
  { sNo: 410, regNo: '26095A0533', name: 'SHAFINA KHANAM K' },
  { sNo: 411, regNo: '26095A0534', name: 'SNEHALATHA T' },
  { sNo: 412, regNo: '26095A0535', name: 'SREENATH S' },
  { sNo: 413, regNo: '26095A0536', name: 'SRUTHI KEERTHI M' },
  { sNo: 414, regNo: '26095A0537', name: 'SUDHEER K' },
  { sNo: 415, regNo: '26095A0538', name: 'THANVEER SALMAN S' },
  { sNo: 416, regNo: '26095A0539', name: 'USHA SREE B' },
  { sNo: 417, regNo: '26095A0540', name: 'VANI K' },
  { sNo: 418, regNo: '26095A0541', name: 'VASANTHI P' },
  { sNo: 419, regNo: '26095A0542', name: 'VENKATA BHAVITHA K' },
  { sNo: 420, regNo: '26095A0543', name: 'VENKATESH N' },
  { sNo: 421, regNo: '26095A0544', name: 'VENKATESWARLU GOUD E' }
];

function seedYear2Students(databaseInstance) {
  const d = databaseInstance || db;
  const now = new Date().toISOString();

  console.log(`[SeedYear2] Processing ${year2StudentsList.length} students for 2nd Year (2025 Batch)...`);

  const checkUserStmt = d.prepare('SELECT id FROM users WHERE UPPER(username) = ?');
  const insertUserStmt = d.prepare(`
    INSERT INTO users (username, password_hash, role, created_at)
    VALUES (?, ?, 'STUDENT', ?)
  `);
  const updateUserPwStmt = d.prepare('UPDATE users SET password_hash = ? WHERE id = ?');

  const checkStudentStmt = d.prepare('SELECT id FROM students WHERE UPPER(reg_no) = ?');
  const insertStudentStmt = d.prepare(`
    INSERT INTO students (
      user_id, reg_no, name, academic_year, semester, section, email, phone, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
  `);
  const updateStudentStmt = d.prepare(`
    UPDATE students 
    SET name = ?, academic_year = ?, semester = ?, section = ?, email = ?
    WHERE id = ?
  `);

  d.exec('BEGIN TRANSACTION');

  try {
    let createdCount = 0;
    let updatedCount = 0;

    for (const s of year2StudentsList) {
      const regUpper = s.regNo.toUpperCase();
      // Divide into Group 1 (1 to 190) and Group 2 (191 to 377)
      const section = s.sNo <= 190 ? 'Group 1' : 'Group 2';
      const email = `${regUpper.toLowerCase()}@rgmcet.edu.in`;

      // Password hash: Registration Number
      const hash = bcrypt.hashSync(regUpper, 8);

      let existingUser = checkUserStmt.get(regUpper);
      let userId;

      if (!existingUser) {
        const uRes = insertUserStmt.run(regUpper, hash, now);
        userId = uRes.lastInsertRowid;
      } else {
        userId = existingUser.id;
        updateUserPwStmt.run(hash, userId);
      }

      const existingStudent = checkStudentStmt.get(regUpper);
      if (!existingStudent) {
        insertStudentStmt.run(
          userId,
          regUpper,
          s.name,
          2, // 2nd Year
          4, // 2nd Semester (II-II)
          section,
          email,
          null,
          now
        );
        createdCount++;
      } else {
        updateStudentStmt.run(
          s.name,
          2,
          4,
          section,
          email,
          existingStudent.id
        );
        updatedCount++;
      }
    }

    d.exec('COMMIT');
    console.log(`[SeedYear2] Completed! Created: ${createdCount}, Updated: ${updatedCount}. Total Year 2 students: ${year2StudentsList.length}`);
    return { createdCount, updatedCount, total: year2StudentsList.length };
  } catch (error) {
    d.exec('ROLLBACK');
    console.error('[SeedYear2] Error seeding Year 2 students:', error);
    throw error;
  }
}

if (require.main === module) {
  seedYear2Students(db);
}

module.exports = { seedYear2Students, year2StudentsList };
