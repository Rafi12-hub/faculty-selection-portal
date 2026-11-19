const { db } = require('../src/config/database');
const bcrypt = require('bcryptjs');

console.log('Seeding 410 RGMCET CSE students and creating login accounts...');

const now = new Date().toISOString();

const studentsList = [
  // Page 1 (1 to 45)
  { sNo: 1, regNo: '24091A0501', name: 'ABDUL MOEES S' },
  { sNo: 2, regNo: '24091A0502', name: 'ABHINAY M' },
  { sNo: 3, regNo: '24091A0503', name: 'ABHINAY N' },
  { sNo: 4, regNo: '24091A0504', name: 'ABHISHEK REDDY G' },
  { sNo: 5, regNo: '24091A0505', name: 'ABRAR S' },
  { sNo: 6, regNo: '24091A0506', name: 'ACHSAH EUNICE M' },
  { sNo: 7, regNo: '24091A0507', name: 'ADARSHA M' },
  { sNo: 8, regNo: '24091A0508', name: 'AKARSH C' },
  { sNo: 9, regNo: '24091A0509', name: 'AKASH S' },
  { sNo: 10, regNo: '24091A0510', name: 'AKHIL M' },
  { sNo: 11, regNo: '24091A0511', name: 'AKHIL NAIK S' },
  { sNo: 12, regNo: '24091A0512', name: 'AKHILA B' },
  { sNo: 13, regNo: '24091A0513', name: 'AKHILAMMA K' },
  { sNo: 14, regNo: '24091A0514', name: 'AMAN MIRZANULLAH S' },
  { sNo: 15, regNo: '24091A0515', name: 'AMARNATH REDDY K' },
  { sNo: 16, regNo: '24091A0516', name: 'AMEENA T' },
  { sNo: 17, regNo: '24091A0517', name: 'AMEER S' },
  { sNo: 18, regNo: '24091A0518', name: 'AMRUTHA G' },
  { sNo: 19, regNo: '24091A0519', name: 'ANEES M' },
  { sNo: 20, regNo: '24091A0520', name: 'ANIL NAIK M' },
  { sNo: 21, regNo: '24091A0521', name: 'ANIL P' },
  { sNo: 22, regNo: '24091A0522', name: 'ANIRUDH JAGANNATH P' },
  { sNo: 23, regNo: '24091A0523', name: 'ANISHA BEE S' },
  { sNo: 24, regNo: '24091A0524', name: 'ANJANEYULU NAIK N' },
  { sNo: 25, regNo: '24091A0525', name: 'ANKITHA S' },
  { sNo: 26, regNo: '24091A0526', name: 'ANUSHA A' },
  { sNo: 27, regNo: '24091A0527', name: 'ANUSHA B' },
  { sNo: 28, regNo: '24091A0528', name: 'ARSHAD BASHA M' },
  { sNo: 29, regNo: '24091A0529', name: 'ARUN KUMAR K' },
  { sNo: 30, regNo: '24091A0530', name: 'ARUNKUMAR T' },
  { sNo: 31, regNo: '24091A0531', name: 'ASHOK C' },
  { sNo: 32, regNo: '24091A0532', name: 'ASHOK LARA Y' },
  { sNo: 33, regNo: '24091A0533', name: 'ASIF D' },
  { sNo: 34, regNo: '24091A0534', name: 'ASWINI K' },
  { sNo: 35, regNo: '24091A0535', name: 'ASWITHA P' },
  { sNo: 36, regNo: '24091A0536', name: 'ATHIKA S' },
  { sNo: 37, regNo: '24091A0537', name: 'BADARINATH REDDY C' },
  { sNo: 38, regNo: '24091A0538', name: 'BALAJI R' },
  { sNo: 39, regNo: '24091A0539', name: 'BHAIRAVA POOJITHA K' },
  { sNo: 40, regNo: '24091A0540', name: 'BHARATH KUMAR C' },
  { sNo: 41, regNo: '24091A0541', name: 'BHARATH KUMAR K' },
  { sNo: 42, regNo: '24091A0542', name: 'BHARATH KUMAR K' },
  { sNo: 43, regNo: '24091A0543', name: 'BHARATHI P' },
  { sNo: 44, regNo: '24091A0544', name: 'BHARGHAVA D' },
  { sNo: 45, regNo: '24091A0545', name: 'BHAVANI J' },

  // Page 2 (46 to 90)
  { sNo: 46, regNo: '24091A0546', name: 'BHAVITHA REDDY G' },
  { sNo: 47, regNo: '24091A0547', name: 'BHUVANA B' },
  { sNo: 48, regNo: '24091A0548', name: 'CHAITHYA SAI M' },
  { sNo: 49, regNo: '24091A0549', name: 'CHANDANA PRIYA M' },
  { sNo: 50, regNo: '24091A0550', name: 'CHANDRA KUMAR D' },
  { sNo: 51, regNo: '24091A0551', name: 'CHANDRA SEKHAR K' },
  { sNo: 52, regNo: '24091A0552', name: 'CHANDRAMOHAN REDDY K' },
  { sNo: 53, regNo: '24091A0553', name: 'CHARAN C' },
  { sNo: 54, regNo: '24091A0554', name: 'CHARAN G' },
  { sNo: 55, regNo: '24091A0555', name: 'CHARAN TEJ T' },
  { sNo: 56, regNo: '24091A0556', name: 'CHARAN VIVEK E' },
  { sNo: 57, regNo: '24091A0557', name: 'CHENNA KESAVA REDDY S' },
  { sNo: 58, regNo: '24091A0558', name: 'CHETHAN SAI Y' },
  { sNo: 59, regNo: '24091A0559', name: 'CHINMAYANANDA M' },
  { sNo: 60, regNo: '24091A0560', name: 'DADAPEER D' },
  { sNo: 61, regNo: '24091A0561', name: 'DEEKSHITHA REDDY C' },
  { sNo: 62, regNo: '24091A0562', name: 'DEEPIKA M' },
  { sNo: 63, regNo: '24091A0563', name: 'DEEPIKA N' },
  { sNo: 64, regNo: '24091A0564', name: 'DEEPIKA REDDY S' },
  { sNo: 65, regNo: '24091A0565', name: 'DEVA KUMAR B' },
  { sNo: 66, regNo: '24091A0566', name: 'DEVENDRA K' },
  { sNo: 67, regNo: '24091A0567', name: 'DHANALAKSHMI M' },
  { sNo: 68, regNo: '24091A0568', name: 'DHANUNJAYA C' },
  { sNo: 69, regNo: '24091A0569', name: 'DHARANI M' },
  { sNo: 70, regNo: '24091A0570', name: 'DHARSHINI I' },
  { sNo: 71, regNo: '24091A0571', name: 'DILEEP KUMAR K' },
  { sNo: 72, regNo: '24091A0572', name: 'DILEEP M' },
  { sNo: 73, regNo: '24091A0573', name: 'DINESH ACHARI K' },
  { sNo: 74, regNo: '24091A0574', name: 'DINESH KUMAR P' },
  { sNo: 75, regNo: '24091A0575', name: 'DINESH REDDY S' },
  { sNo: 76, regNo: '24091A0576', name: 'DIVYA SREE K' },
  { sNo: 77, regNo: '24091A0577', name: 'DIVYAVANI T' },
  { sNo: 78, regNo: '24091A0578', name: 'ESWAR R' },
  { sNo: 79, regNo: '24091A0579', name: 'GABRIYEL H' },
  { sNo: 80, regNo: '24091A0580', name: 'GANESH KUMAR M' },
  { sNo: 81, regNo: '24091A0581', name: 'GANESH KUMAR M' },
  { sNo: 82, regNo: '24091A0582', name: 'GANGA SWAPNA V' },
  { sNo: 83, regNo: '24091A0583', name: 'GAYATHRI P' },
  { sNo: 84, regNo: '24091A0584', name: 'GEETHIKA B' },
  { sNo: 85, regNo: '24091A0585', name: 'GEETHIKA C' },
  { sNo: 86, regNo: '24091A0586', name: 'GEETHIKA G' },
  { sNo: 87, regNo: '24091A0587', name: 'GIRI PRASAD K' },
  { sNo: 88, regNo: '24091A0588', name: 'GIRISHA U' },
  { sNo: 89, regNo: '24091A0589', name: 'GNANA VARSHINI M' },
  { sNo: 90, regNo: '24091A0590', name: 'GOPAL REDDY S' },

  // Page 3 (91 to 135)
  { sNo: 91, regNo: '24091A0591', name: 'GOWRI PRIYA K' },
  { sNo: 92, regNo: '24091A0592', name: 'GUNA SAI G' },
  { sNo: 93, regNo: '24091A0593', name: 'GUNA SAI REDDY B' },
  { sNo: 94, regNo: '24091A0594', name: 'GUNA SHEKAR P' },
  { sNo: 95, regNo: '24091A0595', name: 'GURU JANU B' },
  { sNo: 96, regNo: '24091A0596', name: 'HABIBUNNISA S' },
  { sNo: 97, regNo: '24091A0597', name: 'HADHVIKAA M' },
  { sNo: 98, regNo: '24091A0598', name: 'HAREESH M' },
  { sNo: 99, regNo: '24091A0599', name: 'HARI KRISHNA B' },
  { sNo: 100, regNo: '24091A05A0', name: 'HARI PRIYA T' },
  { sNo: 101, regNo: '24091A05A1', name: 'HARINAIK B' },
  { sNo: 102, regNo: '24091A05A2', name: 'HARINI K' },
  { sNo: 103, regNo: '24091A05A3', name: 'HARINI P' },
  { sNo: 104, regNo: '24091A05A4', name: 'HARITHA S' },
  { sNo: 105, regNo: '24091A05A5', name: 'HARSHA VARDAN B' },
  { sNo: 106, regNo: '24091A05A6', name: 'HARSHANI C' },
  { sNo: 107, regNo: '24091A05A7', name: 'HARSHAVARDHAN B' },
  { sNo: 108, regNo: '24091A05A8', name: 'HARSHAVARDHAN D' },
  { sNo: 109, regNo: '24091A05A9', name: 'HARSHAVARDHAN G' },
  { sNo: 110, regNo: '24091A05AA', name: 'HASWANTH REDDY K' },
  { sNo: 111, regNo: '24091A05AB', name: 'HEMA VARSHITHA P' },
  { sNo: 112, regNo: '24091A05AC', name: 'HEMALATHA J' },
  { sNo: 113, regNo: '24091A05AD', name: 'HEMALATHA T' },
  { sNo: 114, regNo: '24091A05AE', name: 'HEMANTH A' },
  { sNo: 115, regNo: '24091A05AF', name: 'HEMANTH KRISHNA K' },
  { sNo: 116, regNo: '24091A05AG', name: 'HEMANTH KUMAR C' },
  { sNo: 117, regNo: '24091A05AH', name: 'HEMANTH P' },
  { sNo: 118, regNo: '24091A05AJ', name: 'HEMANTH V' },
  { sNo: 119, regNo: '24091A05AK', name: 'HEPSIBHA K' },
  { sNo: 120, regNo: '24091A05AM', name: 'HIMABINDU S' },
  { sNo: 121, regNo: '24091A05AN', name: 'HITA MADHUMINA V' },
  { sNo: 122, regNo: '24091A05AP', name: 'INDRA M' },
  { sNo: 123, regNo: '24091A05AQ', name: 'INTIYAZ HUSSAIN M' },
  { sNo: 124, regNo: '24091A05AR', name: 'ISWARYA K' },
  { sNo: 125, regNo: '24091A05AS', name: 'JAGADEESH KUMAR M' },
  { sNo: 126, regNo: '24091A05AT', name: 'JAHNAVI P' },
  { sNo: 127, regNo: '24091A05AU', name: 'JANANI M' },
  { sNo: 128, regNo: '24091A05AV', name: 'JASWANTH NAIK S' },
  { sNo: 129, regNo: '24091A05AW', name: 'JAVYA Y' },
  { sNo: 130, regNo: '24091A05AX', name: 'JAYA SIMHA REDDY G' },
  { sNo: 131, regNo: '24091A05AY', name: 'JAYARAMANA C' },
  { sNo: 132, regNo: '24091A05B0', name: 'JAYASREE K' },
  { sNo: 133, regNo: '24091A05B1', name: 'JOHN VICTOR G' },
  { sNo: 134, regNo: '24091A05B2', name: 'JOSHITHA R' },
  { sNo: 135, regNo: '24091A05B3', name: 'JUBEDA A' },

  // Page 4 (136 to 180)
  { sNo: 136, regNo: '24091A05B4', name: 'JYOSHNA C' },
  { sNo: 137, regNo: '24091A05B5', name: 'JYOTHSNA V' },
  { sNo: 138, regNo: '24091A05B6', name: 'KANCHANA H' },
  { sNo: 139, regNo: '24091A05B7', name: 'KARISHMA B' },
  { sNo: 140, regNo: '24091A05B8', name: 'KARISHMA M' },
  { sNo: 141, regNo: '24091A05B9', name: 'KARTHIK RAJ G' },
  { sNo: 142, regNo: '24091A05BA', name: 'KARUNA L' },
  { sNo: 143, regNo: '24091A05BB', name: 'KASIESWARI K' },
  { sNo: 144, regNo: '24091A05BC', name: 'KAVITHA K' },
  { sNo: 145, regNo: '24091A05BD', name: 'KAVITHA S' },
  { sNo: 146, regNo: '24091A05BE', name: 'KAVYA G' },
  { sNo: 147, regNo: '24091A05BF', name: 'KAVYA P' },
  { sNo: 148, regNo: '24091A05BG', name: 'KAVYALATHA REDDY P' },
  { sNo: 149, regNo: '24091A05BH', name: 'KEDHARESWAR M' },
  { sNo: 150, regNo: '24091A05BJ', name: 'KOLIMI ABDUL NOOR AHAMED S' },
  { sNo: 151, regNo: '24091A05BK', name: 'KOUSARUNNISA S' },
  { sNo: 152, regNo: '24091A05BM', name: 'KOWSHIK REDDY B' },
  { sNo: 153, regNo: '24091A05BN', name: 'KRISHNA MOHAN N' },
  { sNo: 154, regNo: '24091A05BP', name: 'KRUPAVARAM C' },
  { sNo: 155, regNo: '24091A05BQ', name: 'LAKSHMI BRAHMANI G' },
  { sNo: 156, regNo: '24091A05BR', name: 'LATHA P' },
  { sNo: 157, regNo: '24091A05BS', name: 'LEKHANA N' },
  { sNo: 158, regNo: '24091A05BT', name: 'LIKHITH SAI YADAV V' },
  { sNo: 159, regNo: '24091A05BU', name: 'LIKHITHA J' },
  { sNo: 160, regNo: '24091A05BV', name: 'LIKITHA G' },
  { sNo: 161, regNo: '24091A05BW', name: 'LIKITHA REDDY P' },
  { sNo: 162, regNo: '24091A05BX', name: 'LOKESH G' },
  { sNo: 163, regNo: '24091A05BY', name: 'LOKESH REDDY B' },
  { sNo: 164, regNo: '24091A05C0', name: 'LOKESH REDDY P' },
  { sNo: 165, regNo: '24091A05C1', name: 'MADHU JAHNAVI C' },
  { sNo: 166, regNo: '24091A05C2', name: 'MADHU SUDHAN REDDY J' },
  { sNo: 167, regNo: '24091A05C3', name: 'MADIHA NOORAIN S' },
  { sNo: 168, regNo: '24091A05C4', name: 'MAHABOOB BASHA U' },
  { sNo: 169, regNo: '24091A05C5', name: 'MAHALAKSHMI N' },
  { sNo: 170, regNo: '24091A05C6', name: 'MAHAMMAD RAFI B' },
  { sNo: 171, regNo: '24091A05C7', name: 'MAHAMMED MEHEER S' },
  { sNo: 172, regNo: '24091A05C8', name: 'MAHIDAR ACHARYULU S' },
  { sNo: 173, regNo: '24091A05C9', name: 'MAHIDHAR B' },
  { sNo: 174, regNo: '24091A05CA', name: 'MAHITHA C' },
  { sNo: 175, regNo: '24091A05CB', name: 'MALLIKA B' },
  { sNo: 176, regNo: '24091A05CC', name: 'MAMATHA P' },
  { sNo: 177, regNo: '24091A05CD', name: 'MANASA M' },
  { sNo: 178, regNo: '24091A05CE', name: 'MANASA VEENA C' },
  { sNo: 179, regNo: '24091A05CF', name: 'MANI DIVYA K' },
  { sNo: 180, regNo: '24091A05CG', name: 'MANIDEEP B' },

  // Page 5 (181 to 225)
  { sNo: 181, regNo: '24091A05CH', name: 'MANITEJA G' },
  { sNo: 182, regNo: '24091A05CJ', name: 'MANJUNATH NAIDU T' },
  { sNo: 183, regNo: '24091A05CK', name: 'MANJUSHA G' },
  { sNo: 184, regNo: '24091A05CM', name: 'MANOGNA SREE B' },
  { sNo: 185, regNo: '24091A05CN', name: 'MANOHAR REDDY K' },
  { sNo: 186, regNo: '24091A05CP', name: 'MANOJ KUMAR J' },
  { sNo: 187, regNo: '24091A05CQ', name: 'MAYAVATHI YADAV G' },
  { sNo: 188, regNo: '24091A05CR', name: 'MEENAKSHI K' },
  { sNo: 189, regNo: '24091A05CS', name: 'MEGHANA K' },
  { sNo: 190, regNo: '24091A05CT', name: 'MERCY PARIMALA G' },
  { sNo: 191, regNo: '24091A05CU', name: 'MOHAMMAD GHOUSE FARHAAN T' },
  { sNo: 192, regNo: '24091A05CV', name: 'MOHAMMAD INTHIYAZ D' },
  { sNo: 193, regNo: '24091A05CW', name: 'MOHAMMAD TAUHEED S' },
  { sNo: 194, regNo: '24091A05CX', name: 'MOHAMMAD ZAKIR ALI S' },
  { sNo: 195, regNo: '24091A05CY', name: 'MOHAMMED ASIF D' },
  { sNo: 196, regNo: '24091A05D0', name: 'MOHAN K' },
  { sNo: 197, regNo: '24091A05D1', name: 'MOKSHITHA P' },
  { sNo: 198, regNo: '24091A05D2', name: 'MOUNA SREE G' },
  { sNo: 199, regNo: '24091A05D3', name: 'MOUNIKA G' },
  { sNo: 200, regNo: '24091A05D4', name: 'MOUNIKA S' },
  { sNo: 201, regNo: '24091A05D5', name: 'MUDAVATH MAHESH NAIK S' },
  { sNo: 202, regNo: '24091A05D6', name: 'MUSKAN S' },
  { sNo: 203, regNo: '24091A05D7', name: 'NAGA GOURI C' },
  { sNo: 204, regNo: '24091A05D8', name: 'NAGA PAVANI R' },
  { sNo: 205, regNo: '24091A05D9', name: 'NAGA SAI MADHURI G' },
  { sNo: 206, regNo: '24091A05DA', name: 'NAGA SAI PHANINDRA G' },
  { sNo: 207, regNo: '24091A05DB', name: 'NAGA SINDHURA B' },
  { sNo: 208, regNo: '24091A05DC', name: 'NAGA SRAVANI R' },
  { sNo: 209, regNo: '24091A05DD', name: 'NAGA SUDHA PARIMALA C' },
  { sNo: 210, regNo: '24091A05DE', name: 'NAGA VENKATESH RAJU B' },
  { sNo: 211, regNo: '24091A05DF', name: 'NAGENDRA N' },
  { sNo: 212, regNo: '24091A05DG', name: 'NANDA KISHORE REDDY G' },
  { sNo: 213, regNo: '24091A05DH', name: 'NANDINI K' },
  { sNo: 214, regNo: '24091A05DJ', name: 'NANDINI M' },
  { sNo: 215, regNo: '24091A05DK', name: 'NANDINI S' },
  { sNo: 216, regNo: '24091A05DM', name: 'NANDINI T' },
  { sNo: 217, regNo: '24091A05DN', name: 'NARASIMHA G' },
  { sNo: 218, regNo: '24091A05DP', name: 'NARASIMHA REDDY D' },
  { sNo: 219, regNo: '24091A05DQ', name: 'NASREEN BANU S' },
  { sNo: 220, regNo: '24091A05DR', name: 'NAVITHA A' },
  { sNo: 221, regNo: '24091A05DS', name: 'NAVITHA M' },
  { sNo: 222, regNo: '24091A05DT', name: 'NAVYA M' },
  { sNo: 223, regNo: '24091A05DU', name: 'NAVYA N' },
  { sNo: 224, regNo: '24091A05DV', name: 'NAVYASREE G' },
  { sNo: 225, regNo: '24091A05DW', name: 'NAYEEM M' },

  // Page 6 (226 to 270)
  { sNo: 226, regNo: '24091A05DX', name: 'NIHARIKA G' },
  { sNo: 227, regNo: '24091A05DY', name: 'NIHARIKA P' },
  { sNo: 228, regNo: '24091A05E0', name: 'NIKHIL D' },
  { sNo: 229, regNo: '24091A05E1', name: 'NIKHILA P' },
  { sNo: 230, regNo: '24091A05E2', name: 'NIRANJAN P' },
  { sNo: 231, regNo: '24091A05E3', name: 'NITHIN B' },
  { sNo: 232, regNo: '24091A05E4', name: 'NOOR MAHAMMAD S' },
  { sNo: 233, regNo: '24091A05E5', name: 'PARAMESH B' },
  { sNo: 234, regNo: '24091A05E6', name: 'PARINAY S' },
  { sNo: 235, regNo: '24091A05E7', name: 'PAVAN G' },
  { sNo: 236, regNo: '24091A05E8', name: 'PAVAN KUMAR REDDY K' },
  { sNo: 237, regNo: '24091A05E9', name: 'PRABHAS A' },
  { sNo: 238, regNo: '24091A05EA', name: 'PRAGNA K' },
  { sNo: 239, regNo: '24091A05EB', name: 'PRANADEEP S' },
  { sNo: 240, regNo: '24091A05EC', name: 'PRASHANTH S' },
  { sNo: 241, regNo: '24091A05ED', name: 'PRATHUNA DEEP N' },
  { sNo: 242, regNo: '24091A05EE', name: 'PRAVALLIKA M' },
  { sNo: 243, regNo: '24091A05EF', name: 'PRAVEEN KUMAR K' },
  { sNo: 244, regNo: '24091A05EG', name: 'PREETHAM PAUL D' },
  { sNo: 245, regNo: '24091A05EH', name: 'PUJITHA P' },
  { sNo: 246, regNo: '24091A05EJ', name: 'PUNITH SAI P' },
  { sNo: 247, regNo: '24091A05EK', name: 'RAGHUNATH REDDY P' },
  { sNo: 248, regNo: '24091A05EM', name: 'RAGHUVARDHAN M' },
  { sNo: 249, regNo: '24091A05EN', name: 'RAJESH S' },
  { sNo: 250, regNo: '24091A05EP', name: 'RAJITHA K' },
  { sNo: 251, regNo: '24091A05EQ', name: 'RAMANJANEYULU P' },
  { sNo: 252, regNo: '24091A05ER', name: 'RAVI PRASAD A' },
  { sNo: 253, regNo: '24091A05ES', name: 'RAVINDRA M' },
  { sNo: 254, regNo: '24091A05ET', name: 'REENA K' },
  { sNo: 255, regNo: '24091A05EU', name: 'RISHI KUMAR K' },
  { sNo: 256, regNo: '24091A05EV', name: 'ROHIN RAJ VARMA C' },
  { sNo: 257, regNo: '24091A05EW', name: 'RUBANA S' },
  { sNo: 258, regNo: '24091A05EX', name: 'RUCHITHA T' },
  { sNo: 259, regNo: '24091A05EY', name: 'SAHANA N' },
  { sNo: 260, regNo: '24091A05F0', name: 'SAI C' },
  { sNo: 261, regNo: '24091A05F1', name: 'SAI DEEKSHITH REDDY B' },
  { sNo: 262, regNo: '24091A05F2', name: 'SAI HRUDAN G' },
  { sNo: 263, regNo: '24091A05F3', name: 'SAI KIRAN P' },
  { sNo: 264, regNo: '24091A05F4', name: 'SAI KUMAR Y' },
  { sNo: 265, regNo: '24091A05F5', name: 'SAI NIHARIKA K' },
  { sNo: 266, regNo: '24091A05F6', name: 'SAI NIRANJAN G' },
  { sNo: 267, regNo: '24091A05F7', name: 'SAI P' },
  { sNo: 268, regNo: '24091A05F8', name: 'SAI RUKMINI M' },
  { sNo: 269, regNo: '24091A05F9', name: 'SAI TEJESH T' },
  { sNo: 270, regNo: '24091A05FA', name: 'SAI VIGNESHWAR REDDY M' },

  // Page 7 (271 to 315)
  { sNo: 271, regNo: '24091A05FB', name: 'SAILAJA K' },
  { sNo: 272, regNo: '24091A05FC', name: 'SAILESH J' },
  { sNo: 273, regNo: '24091A05FD', name: 'SAINATH REDDY J' },
  { sNo: 274, regNo: '24091A05FE', name: 'SAIRA BHANU K' },
  { sNo: 275, regNo: '24091A05FF', name: 'SAKIB RIHAN K' },
  { sNo: 276, regNo: '24091A05FG', name: 'SALMA TAJ P' },
  { sNo: 277, regNo: '24091A05FH', name: 'SALMAN N' },
  { sNo: 278, regNo: '24091A05FJ', name: 'SAMA NAIK R' },
  { sNo: 279, regNo: '24091A05FK', name: 'SAMAIKYA B' },
  { sNo: 280, regNo: '24091A05FM', name: 'SAMARESWAR REDDY G' },
  { sNo: 281, regNo: '24091A05FN', name: 'SAMINA BEGUM K' },
  { sNo: 282, regNo: '24091A05FP', name: 'SAMPATH REDDY K' },
  { sNo: 283, regNo: '24091A05FQ', name: 'SANDEEP REDDY O' },
  { sNo: 284, regNo: '24091A05FR', name: 'SANDEEPREDDY K' },
  { sNo: 285, regNo: '24091A05FS', name: 'SANTHOSH M' },
  { sNo: 286, regNo: '24091A05FT', name: 'SANTHOSH M' },
  { sNo: 287, regNo: '24091A05FU', name: 'SANTHOSH REDDY K' },
  { sNo: 288, regNo: '24091A05FV', name: 'SANTHOSH YADAV K' },
  { sNo: 289, regNo: '24091A05FW', name: 'SATEESH KUMAR P' },
  { sNo: 290, regNo: '24091A05FX', name: 'SAZIA ANJUM S' },
  { sNo: 291, regNo: '24091A05FY', name: 'SHAHALYA M' },
  { sNo: 292, regNo: '24091A05G0', name: 'SHAILAJA K' },
  { sNo: 293, regNo: '24091A05G1', name: 'SHAINI M' },
  { sNo: 294, regNo: '24091A05G2', name: 'SHAMEER P' },
  { sNo: 295, regNo: '24091A05G3', name: 'SHAMEERA B' },
  { sNo: 296, regNo: '24091A05G4', name: 'SHASHANK A' },
  { sNo: 297, regNo: '24091A05G5', name: 'SHASHIKANTH K' },
  { sNo: 298, regNo: '24091A05G6', name: 'SHIEMA T' },
  { sNo: 299, regNo: '24091A05G7', name: 'SHIREESHA J' },
  { sNo: 300, regNo: '24091A05G8', name: 'SHIVA RAJ KUMAR G' },
  { sNo: 301, regNo: '24091A05G9', name: 'SHIVA SHANKAR K' },
  { sNo: 302, regNo: '24091A05GA', name: 'SHIVANI KUMARI B' },
  { sNo: 303, regNo: '24091A05GB', name: 'SHOBHA RANI P' },
  { sNo: 304, regNo: '24091A05GC', name: 'SINDHU M' },
  { sNo: 305, regNo: '24091A05GD', name: 'SIRI CHANDANA B' },
  { sNo: 306, regNo: '24091A05GE', name: 'SIRI G' },
  { sNo: 307, regNo: '24091A05GF', name: 'SIRILATHA REDDY K' },
  { sNo: 308, regNo: '24091A05GG', name: 'SIVA KUMAR REDDY C' },
  { sNo: 309, regNo: '24091A05GH', name: 'SIVA SANKAR NAIK M' },
  { sNo: 310, regNo: '24091A05GJ', name: 'SONY G' },
  { sNo: 311, regNo: '24091A05GK', name: 'SOUNDARYA MANI S' },
  { sNo: 312, regNo: '24091A05GM', name: 'SPANDANA G' },
  { sNo: 313, regNo: '24091A05GN', name: 'SPANDANA G' },
  { sNo: 314, regNo: '24091A05GP', name: 'SRAVANI A' },
  { sNo: 315, regNo: '24091A05GQ', name: 'SRAVANI C' },

  // Page 8 (316 to 360)
  { sNo: 316, regNo: '24091A05GR', name: 'SRAVANTHI R' },
  { sNo: 317, regNo: '24091A05GS', name: 'SREE HARI P' },
  { sNo: 318, regNo: '24091A05GT', name: 'SREE VISHNU PRANEETH P' },
  { sNo: 319, regNo: '24091A05GU', name: 'SREELATHA K' },
  { sNo: 320, regNo: '24091A05GV', name: 'SREERAMULA PRASANNA Y' },
  { sNo: 321, regNo: '24091A05GW', name: 'SREEVIDHYA REDDY R' },
  { sNo: 322, regNo: '24091A05GX', name: 'SREEVIGNA K' },
  { sNo: 323, regNo: '24091A05GY', name: 'SRIHITHA SARMA A' },
  { sNo: 324, regNo: '24091A05H0', name: 'SRIKANTH N' },
  { sNo: 325, regNo: '24091A05H1', name: 'SRINIDHI T' },
  { sNo: 326, regNo: '24091A05H2', name: 'SRINIVASULU G' },
  { sNo: 327, regNo: '24091A05H3', name: 'SRIVANI B' },
  { sNo: 328, regNo: '24091A05H4', name: 'SUCHARITHA M' },
  { sNo: 329, regNo: '24091A05H5', name: 'SUDEEP K' },
  { sNo: 330, regNo: '24091A05H6', name: 'SUMANTH S' },
  { sNo: 331, regNo: '24091A05H7', name: 'SUMITHRA E' },
  { sNo: 332, regNo: '24091A05H8', name: 'SUNIL KUMAR S' },
  { sNo: 333, regNo: '24091A05H9', name: 'SUNKARA MEENAKSHI D' },
  { sNo: 334, regNo: '24091A05HA', name: 'SURENDRA KUMAR P' },
  { sNo: 335, regNo: '24091A05HB', name: 'SURYA KIRAN B' },
  { sNo: 336, regNo: '24091A05HC', name: 'SURYA PRAKASH REDDY B' },
  { sNo: 337, regNo: '24091A05HD', name: 'SUSHMA G' },
  { sNo: 338, regNo: '24091A05HE', name: 'SUSHMITHA B' },
  { sNo: 339, regNo: '24091A05HF', name: 'SUSHMITHA S' },
  { sNo: 340, regNo: '24091A05HG', name: 'SUSMITHA K' },
  { sNo: 341, regNo: '24091A05HH', name: 'SUSMITHA P' },
  { sNo: 342, regNo: '24091A05HJ', name: 'SWARUPA P' },
  { sNo: 343, regNo: '24091A05HK', name: 'TARAK RAM K' },
  { sNo: 344, regNo: '24091A05HM', name: 'TEJA LAKSHMANA P' },
  { sNo: 345, regNo: '24091A05HN', name: 'TEJA N' },
  { sNo: 346, regNo: '24091A05HP', name: 'TEJASREE REDDY A' },
  { sNo: 347, regNo: '24091A05HQ', name: 'TEJASWI M' },
  { sNo: 348, regNo: '24091A05HR', name: 'THANMAYE P' },
  { sNo: 349, regNo: '24091A05HS', name: 'THARUN K' },
  { sNo: 350, regNo: '24091A05HT', name: 'THARUN KUMAR REDDY P' },
  { sNo: 351, regNo: '24091A05HU', name: 'THARUN NAIK R' },
  { sNo: 352, regNo: '24091A05HV', name: 'THARUN TEJA K' },
  { sNo: 353, regNo: '24091A05HW', name: 'THARUNI K' },
  { sNo: 354, regNo: '24091A05HX', name: 'TILAK KUMAR REDDY B' },
  { sNo: 355, regNo: '24091A05HY', name: 'UDAY KIRAN N' },
  { sNo: 356, regNo: '24091A05J0', name: 'UDAYA CHANDRIKA B' },
  { sNo: 357, regNo: '24091A05J1', name: 'UDAYASREE D' },
  { sNo: 358, regNo: '24091A05J2', name: 'UDAYESWAR REDDY V' },
  { sNo: 359, regNo: '24091A05J3', name: 'UPENDRA N' },
  { sNo: 360, regNo: '24091A05J4', name: 'URMILA E' },

  // Page 9 (361 to 405)
  { sNo: 361, regNo: '24091A05J5', name: 'VAMSI G' },
  { sNo: 362, regNo: '24091A05J6', name: 'VAMSI KRISHNA M' },
  { sNo: 363, regNo: '24091A05J7', name: 'VARDHAN V' },
  { sNo: 364, regNo: '24091A05J8', name: 'VARSHINI A' },
  { sNo: 365, regNo: '24091A05J9', name: 'VARSHINI R' },
  { sNo: 366, regNo: '24091A05JA', name: 'VARUN NAIK K' },
  { sNo: 367, regNo: '24091A05JB', name: 'VASU KUMAR REDDY N' },
  { sNo: 368, regNo: '24091A05JC', name: 'VEDA ASRITHA S' },
  { sNo: 369, regNo: '24091A05JD', name: 'VENKATA ARAVIND D' },
  { sNo: 370, regNo: '24091A05JE', name: 'VENKATA BHAVANA N' },
  { sNo: 371, regNo: '24091A05JF', name: 'VENKATA BHUVANESH K' },
  { sNo: 372, regNo: '24091A05JG', name: 'VENKATA HARSHA VARDHAN REDDY B' },
  { sNo: 373, regNo: '24091A05JH', name: 'VENKATA JAYANTH P' },
  { sNo: 374, regNo: '24091A05JJ', name: 'VENKATA KAMALANATH B' },
  { sNo: 375, regNo: '24091A05JK', name: 'VENKATA LOKESH G' },
  { sNo: 376, regNo: '24091A05JM', name: 'VENKATA NAGESHWARI Y' },
  { sNo: 377, regNo: '24091A05JN', name: 'VENKATA PRUDHVI NATH REDDY A' },
  { sNo: 378, regNo: '24091A05JP', name: 'VENKATA RAHUL SANTOSH T' },
  { sNo: 379, regNo: '24091A05JQ', name: 'VENKATA RITHWIQ P' },
  { sNo: 380, regNo: '24091A05JR', name: 'VENKATA SAI GOWTHAM Y' },
  { sNo: 381, regNo: '24091A05JS', name: 'VENKATA SAI P' },
  { sNo: 382, regNo: '24091A05JT', name: 'VENKATA SAI PRAGNAN S' },
  { sNo: 383, regNo: '24091A05JU', name: 'VENKATA SIVA HARI PRASAD ACHARI K' },
  { sNo: 384, regNo: '24091A05JV', name: 'VENKATA TEJASHWINI A' },
  { sNo: 385, regNo: '24091A05JW', name: 'VENKATA YADAV P' },
  { sNo: 386, regNo: '24091A05JX', name: 'VENKATA YAMINI S' },
  { sNo: 387, regNo: '24091A05JY', name: 'VENKATASAGAR B' },
  { sNo: 388, regNo: '24091A05K0', name: 'VENKATESWARAMMA G' },
  { sNo: 389, regNo: '24091A05K1', name: 'VENNELA B' },
  { sNo: 390, regNo: '24091A05K2', name: 'VENU A' },
  { sNo: 391, regNo: '24091A05K3', name: 'VIDYA SREE K' },
  { sNo: 392, regNo: '24091A05K4', name: 'VIJAYA LAKSHMI C' },
  { sNo: 393, regNo: '24091A05K5', name: 'VINAY KRISHNA K' },
  { sNo: 394, regNo: '24091A05K6', name: 'VISHAL BEE S' },
  { sNo: 395, regNo: '24091A05K7', name: 'VISHNU K' },
  { sNo: 396, regNo: '24091A05K8', name: 'VISHNU VARDHAN REDDY K' },
  { sNo: 397, regNo: '24091A05K9', name: 'VISWANATH RAJU P' },
  { sNo: 398, regNo: '24091A05KA', name: 'VYSHNAVI C' },
  { sNo: 399, regNo: '24091A05KB', name: 'VYSHNAVI K' },
  { sNo: 400, regNo: '24091A05KC', name: 'YASHASWINI R' },
  { sNo: 401, regNo: '24091A05KD', name: 'YASHASWINI Y' },
  { sNo: 402, regNo: '24091A05KE', name: 'YASHODA A' },
  { sNo: 403, regNo: '24091A05KF', name: 'YASWANTH B' },
  { sNo: 404, regNo: '24091A05KG', name: 'YASWANTH K' },
  { sNo: 405, regNo: '24091A05KH', name: 'YASWANTHI K' },

  // Page 10 (406 to 410)
  { sNo: 406, regNo: '24091A05KJ', name: 'YAZAZ AHAMMAD V' },
  { sNo: 407, regNo: '24091A05KK', name: 'YELLA DEVI K' },
  { sNo: 408, regNo: '24091A05KM', name: 'YUGANDHAR K' },
  { sNo: 409, regNo: '24091A05KN', name: 'YUVARAJU G' },
  { sNo: 410, regNo: '24091A05KP', name: 'ZAHEER P' }
];

console.log(`Loaded ${studentsList.length} student records from Admission Numbers 2024 Batch.`);

// Function to divide students into 2 groups (3rd Year):
// Group 1: 501 to 5E2 (sNo 1 to 230, total 230 students)
// Group 2 (Group B): Remaining from 5E3 to 5KP (sNo 231 to 410, total 180 students)
function getSection(sNo) {
  if (sNo <= 230) return 'Group 1';
  return 'Group 2';
}

const checkUserStmt = db.prepare('SELECT id FROM users WHERE UPPER(username) = ?');
const insertUserStmt = db.prepare(`
  INSERT INTO users (username, password_hash, role, created_at)
  VALUES (?, ?, 'STUDENT', ?)
`);
const updateUserPwStmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');

const checkStudentStmt = db.prepare('SELECT id FROM students WHERE UPPER(reg_no) = ?');
const insertStudentStmt = db.prepare(`
  INSERT INTO students (
    user_id, reg_no, name, academic_year, semester, section, email, phone, status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
`);
const updateStudentStmt = db.prepare(`
  UPDATE students 
  SET name = ?, academic_year = ?, semester = ?, section = ?, email = ?
  WHERE id = ?
`);

db.exec('BEGIN TRANSACTION');

try {
  let createdCount = 0;
  let updatedCount = 0;

  for (const s of studentsList) {
    const regUpper = s.regNo.toUpperCase();
    const section = getSection(s.sNo);
    const email = `${regUpper.toLowerCase()}@rgmcet.edu.in`;
    
    // Hash registration number with salt rounds 8 (fast and secure)
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
        3, // 3rd Year
        6, // 2nd Semester (III-II)
        section,
        email,
        null,
        now
      );
      createdCount++;
    } else {
      updateStudentStmt.run(
        s.name,
        3,
        6,
        section,
        email,
        existingStudent.id
      );
      updatedCount++;
    }
  }

  db.exec('COMMIT');
  console.log(`Successfully processed 410 students! Created: ${createdCount}, Updated: ${updatedCount}.`);
} catch (error) {
  db.exec('ROLLBACK');
  console.error('Failed to seed students:', error);
  process.exit(1);
}
