/**
 * RGMCET Admission Numbers - 3rd Year B.Tech CSE (III-II Nominal Rolls)
 * Total: 431 Students
 * Group A (Group 1 - Green rows): 216 Students (sNo 1 to 216)
 * Group B (Group 2 - Remaining rows): 215 Students (sNo 217 to 431)
 */

const { db } = require('../src/config/database');
const bcrypt = require('bcryptjs');

const year3StudentsList = [
  { sNo: 1, regNo: '24091A0501', name: 'SHAIK ABDUL MOEES', section: 'Group 1' },
  { sNo: 2, regNo: '24091A0502', name: 'MOPURI ABHINAY', section: 'Group 1' },
  { sNo: 3, regNo: '24091A0503', name: 'N ABHINAY', section: 'Group 1' },
  { sNo: 4, regNo: '24091A0504', name: 'GAJJALA ABHISHEK REDDY', section: 'Group 1' },
  { sNo: 5, regNo: '24091A0505', name: 'SHAIK ABRAR', section: 'Group 1' },
  { sNo: 6, regNo: '24091A0506', name: 'M R G ACHSAH EUNICE', section: 'Group 1' },
  { sNo: 7, regNo: '24091A0507', name: 'MUKKELA ADARSHA', section: 'Group 1' },
  { sNo: 8, regNo: '24091A0508', name: 'CHEGU AKARSH', section: 'Group 1' },
  { sNo: 9, regNo: '24091A0509', name: 'SANNA NAGANNA GARI AKASH', section: 'Group 1' },
  { sNo: 10, regNo: '24091A0510', name: 'MITTE AKHIL', section: 'Group 1' },
  { sNo: 11, regNo: '24091A0512', name: 'BONTHA AKHILA', section: 'Group 1' },
  { sNo: 12, regNo: '24091A0513', name: 'KOORANNA GARI AKHILAMMA', section: 'Group 1' },
  { sNo: 13, regNo: '24091A0514', name: 'SYED AMAN MIRZANULLAH', section: 'Group 1' },
  { sNo: 14, regNo: '24091A0515', name: 'KONDREDDY AMARNATH REDDY', section: 'Group 1' },
  { sNo: 15, regNo: '24091A0516', name: 'THONDALADINNE AMEENA', section: 'Group 1' },
  { sNo: 16, regNo: '24091A0517', name: 'GADDIPATI AMRUTHA', section: 'Group 1' },
  { sNo: 17, regNo: '24091A0518', name: 'MANIYAR ANEES', section: 'Group 1' },
  { sNo: 18, regNo: '24091A0519', name: 'MUDE ANIL NAIK', section: 'Group 1' },
  { sNo: 19, regNo: '24091A0520', name: 'POTTIPOGU ANIL', section: 'Group 1' },
  { sNo: 20, regNo: '24091A0521', name: 'POLUDASU ANIRUDH JAGANNATH', section: 'Group 1' },
  { sNo: 21, regNo: '24091A0522', name: 'SYED ANISHA BEE', section: 'Group 1' },
  { sNo: 22, regNo: '24091A0523', name: 'NENAVATH ANJANEYULU NAIK', section: 'Group 1' },
  { sNo: 23, regNo: '24091A0524', name: 'SAJJANNA GANDLA ANKITHA', section: 'Group 1' },
  { sNo: 24, regNo: '24091A0525', name: 'A ANUSHA', section: 'Group 1' },
  { sNo: 25, regNo: '24091A0526', name: 'B ANUSHA', section: 'Group 1' },
  { sNo: 26, regNo: '24091A0527', name: 'MULLA ARSHAD BASHA', section: 'Group 1' },
  { sNo: 27, regNo: '24091A0528', name: 'KAMALAPURI ARUN KUMAR', section: 'Group 1' },
  { sNo: 28, regNo: '24091A0529', name: 'TALARI ARUNKUMAR', section: 'Group 1' },
  { sNo: 29, regNo: '24091A0531', name: 'YENUGULA ASHOK LARA', section: 'Group 1' },
  { sNo: 30, regNo: '24091A0532', name: 'DUDEKULA ASIF', section: 'Group 1' },
  { sNo: 31, regNo: '24091A0533', name: 'KAMANURU ASWINI', section: 'Group 1' },
  { sNo: 32, regNo: '24091A0534', name: 'PENNABADI ASWITHA', section: 'Group 1' },
  { sNo: 33, regNo: '24091A0535', name: 'SHAIK ATHIKA', section: 'Group 1' },
  { sNo: 34, regNo: '24091A0536', name: 'CHINNAGIREDDY GARI BADARINATH REDDY', section: 'Group 1' },
  { sNo: 35, regNo: '24091A0537', name: 'REDDICHERLA BALAJI', section: 'Group 1' },
  { sNo: 36, regNo: '24091A0538', name: 'KAKANURU BHAIRAVA POOJITHA', section: 'Group 1' },
  { sNo: 37, regNo: '24091A0539', name: 'CHINNAMARU BHARATH KUMAR', section: 'Group 1' },
  { sNo: 38, regNo: '24091A0540', name: 'KANISETTY BHARATH KUMAR', section: 'Group 1' },
  { sNo: 39, regNo: '24091A0542', name: 'PULASANI BHARATHI', section: 'Group 1' },
  { sNo: 40, regNo: '24091A0543', name: 'DEVARAKONDA BHARGHAVA', section: 'Group 1' },
  { sNo: 41, regNo: '24091A0544', name: 'JAKKALA BHAVANI', section: 'Group 1' },
  { sNo: 42, regNo: '24091A0545', name: 'GUNDAM BHAVITHA REDDY', section: 'Group 1' },
  { sNo: 43, regNo: '24091A0546', name: 'B BHUVANA', section: 'Group 1' },
  { sNo: 44, regNo: '24091A0547', name: 'MUSTIPALLI CHAITHYA SAI', section: 'Group 1' },
  { sNo: 45, regNo: '24091A0550', name: 'KAPPALA CHANDRA SEKHAR', section: 'Group 1' },
  { sNo: 46, regNo: '24091A0551', name: 'KOYALADENNE CHANDRAMOHAN REDDY', section: 'Group 1' },
  { sNo: 47, regNo: '24091A0552', name: 'CHANDA CHARAN', section: 'Group 1' },
  { sNo: 48, regNo: '24091A0553', name: 'GIRIPOGU CHARAN', section: 'Group 1' },
  { sNo: 49, regNo: '24091A0554', name: 'TULASI CHARAN TEJ', section: 'Group 1' },
  { sNo: 50, regNo: '24091A0555', name: 'ESARI CHARAN VIVEK', section: 'Group 1' },
  { sNo: 51, regNo: '24091A0556', name: 'SAGILI CHENNA KESAVA REDDY', section: 'Group 1' },
  { sNo: 52, regNo: '24091A0557', name: 'YEKKALA CHETHAN SAI', section: 'Group 1' },
  { sNo: 53, regNo: '24091A0558', name: 'M CHINMAYANANDA', section: 'Group 1' },
  { sNo: 54, regNo: '24091A0559', name: 'DUDEKULA DADAPEER', section: 'Group 1' },
  { sNo: 55, regNo: '24091A0560', name: 'C M DEEKSHITHA REDDY', section: 'Group 1' },
  { sNo: 56, regNo: '24091A0561', name: 'MALE DEEPIKA', section: 'Group 1' },
  { sNo: 57, regNo: '24091A0562', name: 'NAGURU DEEPIKA', section: 'Group 1' },
  { sNo: 58, regNo: '24091A0563', name: 'SOMA DEEPIKA REDDY', section: 'Group 1' },
  { sNo: 59, regNo: '24091A0564', name: 'BANGI DEVA KUMAR', section: 'Group 1' },
  { sNo: 60, regNo: '24091A0565', name: 'KURUVA DEVENDRA', section: 'Group 1' },
  { sNo: 61, regNo: '24091A0566', name: 'MANGALI DHANALAKSHMI', section: 'Group 1' },
  { sNo: 62, regNo: '24091A0567', name: 'CHITTIBOYINA DHANUNJAYA', section: 'Group 1' },
  { sNo: 63, regNo: '24091A0568', name: 'MAJJARI DHARANI', section: 'Group 1' },
  { sNo: 64, regNo: '24091A0569', name: 'ITHAMUKKALA DHARSHINI', section: 'Group 1' },
  { sNo: 65, regNo: '24091A0570', name: 'KUKKALA DILEEP KUMAR', section: 'Group 1' },
  { sNo: 66, regNo: '24091A0571', name: 'MODU PALLI DILEEP', section: 'Group 1' },
  { sNo: 67, regNo: '24091A0572', name: 'KAMSALA DINESH ACHARI', section: 'Group 1' },
  { sNo: 68, regNo: '24091A0573', name: 'PERUMALLA DINESH KUMAR', section: 'Group 1' },
  { sNo: 69, regNo: '24091A0574', name: 'SANJAMALA DINESH REDDY', section: 'Group 1' },
  { sNo: 70, regNo: '24091A0575', name: 'KUNUTHURU DIVYA SREE', section: 'Group 1' },
  { sNo: 71, regNo: '24091A0576', name: 'TELUGU DIVYAVANI', section: 'Group 1' },
  { sNo: 72, regNo: '24091A0577', name: 'RAYACHOTI ESWAR', section: 'Group 1' },
  { sNo: 73, regNo: '24091A0578', name: 'HARIJANA GABRIYEL', section: 'Group 1' },
  { sNo: 74, regNo: '24091A0579', name: 'MEKALA GANESH KUMAR', section: 'Group 1' },
  { sNo: 75, regNo: '24091A0580', name: 'MANDLA GANESH KUMAR', section: 'Group 1' },
  { sNo: 76, regNo: '24091A0581', name: 'VALLAM GANGA SWAPNA', section: 'Group 1' },
  { sNo: 77, regNo: '24091A0582', name: 'PANAKANAPALLI GAYATHRI', section: 'Group 1' },
  { sNo: 78, regNo: '24091A0583', name: 'BASHIKALA GEETHIKA', section: 'Group 1' },
  { sNo: 79, regNo: '24091A0584', name: 'CHIYYAVARAM GEETHIKA', section: 'Group 1' },
  { sNo: 80, regNo: '24091A0585', name: 'GAJULA GEETHIKA', section: 'Group 1' },
  { sNo: 81, regNo: '24091A0586', name: 'KATIPOGU GIRI PRASAD', section: 'Group 1' },
  { sNo: 82, regNo: '24091A0587', name: 'UTTI GIRISHA', section: 'Group 1' },
  { sNo: 83, regNo: '24091A0588', name: 'MEESARAGANDA GNANA VARSHINI', section: 'Group 1' },
  { sNo: 84, regNo: '24091A0589', name: 'SIRIGIRI GOPAL REDDY', section: 'Group 1' },
  { sNo: 85, regNo: '24091A0590', name: 'KUNCHA GOWRI PRIYA', section: 'Group 1' },
  { sNo: 86, regNo: '24091A0591', name: 'GORANTLA GUNA SAI', section: 'Group 1' },
  { sNo: 87, regNo: '24091A0592', name: 'BACCHU GUNA SAI REDDY', section: 'Group 1' },
  { sNo: 88, regNo: '24091A0593', name: 'PAGIDI GUNA SHEKAR', section: 'Group 1' },
  { sNo: 89, regNo: '24091A0594', name: 'BANDE GURU JANU', section: 'Group 1' },
  { sNo: 90, regNo: '24091A0595', name: 'SHAIK HABIBUNNISA', section: 'Group 1' },
  { sNo: 91, regNo: '24091A0597', name: 'MACHHA HAREESH', section: 'Group 1' },
  { sNo: 92, regNo: '24091A0599', name: 'THALARI HARI PRIYA', section: 'Group 1' },
  { sNo: 93, regNo: '24091A05A1', name: 'KATASANI HARINI', section: 'Group 1' },
  { sNo: 94, regNo: '24091A05A2', name: 'PILLI HARINI', section: 'Group 1' },
  { sNo: 95, regNo: '24091A05A3', name: 'SOMULA HARITHA', section: 'Group 1' },
  { sNo: 96, regNo: '24091A05A4', name: 'BONASI HARSHA VARDAN', section: 'Group 1' },
  { sNo: 97, regNo: '24091A05A5', name: 'CHINTHAKAYALA HARSHANI', section: 'Group 1' },
  { sNo: 98, regNo: '24091A05A6', name: 'BOYA HARSHAVARDHAN', section: 'Group 1' },
  { sNo: 99, regNo: '24091A05A7', name: 'DABBUGOTTU HARSHAVARDHAN', section: 'Group 1' },
  { sNo: 100, regNo: '24091A05A8', name: 'GANDHODI HARSHAVARDHAN', section: 'Group 1' },
  { sNo: 101, regNo: '24091A05A9', name: 'KATREDDY HASWANTH REDDY', section: 'Group 1' },
  { sNo: 102, regNo: '24091A05AB', name: 'JAKKIREDDY HEMALATHA', section: 'Group 1' },
  { sNo: 103, regNo: '24091A05AC', name: 'T HEMALATHA', section: 'Group 1' },
  { sNo: 104, regNo: '24091A05AD', name: 'AKULA HEMANTH', section: 'Group 1' },
  { sNo: 105, regNo: '24091A05AE', name: 'KOLAGANI HEMANTH KRISHNA', section: 'Group 1' },
  { sNo: 106, regNo: '24091A05AF', name: 'CHEKKA HEMANTH KUMAR', section: 'Group 1' },
  { sNo: 107, regNo: '24091A05AG', name: 'PAMISETTY HEMANTH', section: 'Group 1' },
  { sNo: 108, regNo: '24091A05AH', name: 'VADDE HEMANTH', section: 'Group 1' },
  { sNo: 109, regNo: '24091A05AJ', name: 'KALURI HEPSIBHA', section: 'Group 1' },
  { sNo: 110, regNo: '24091A05AK', name: 'SIVAPURAM HIMABINDU', section: 'Group 1' },
  { sNo: 111, regNo: '24091A05AM', name: 'V HITA MADHUMINA', section: 'Group 1' },
  { sNo: 112, regNo: '24091A05AN', name: 'MARAS INDRA', section: 'Group 1' },
  { sNo: 113, regNo: '24091A05AP', name: 'MULA PALLI INTIYAZ HUSSAIN', section: 'Group 1' },
  { sNo: 114, regNo: '24091A05AQ', name: 'KOMIREDDY ISWARYA', section: 'Group 1' },
  { sNo: 115, regNo: '24091A05AR', name: 'MYDUKUR JAGADEESH KUMAR', section: 'Group 1' },
  { sNo: 116, regNo: '24091A05AS', name: 'PUCCHAKAYALA JAHNAVI', section: 'Group 1' },
  { sNo: 117, regNo: '24091A05AU', name: 'MEENIGE JANANI', section: 'Group 1' },
  { sNo: 118, regNo: '24091A05AV', name: 'SUGALI JASWANTH NAIK', section: 'Group 1' },
  { sNo: 119, regNo: '24091A05AW', name: 'YALLURI JAVYA', section: 'Group 1' },
  { sNo: 120, regNo: '24091A05AX', name: 'G JAYA SIMHA REDDY', section: 'Group 1' },
  { sNo: 121, regNo: '24091A05AY', name: 'CHAKALI JAYARAMANA', section: 'Group 1' },
  { sNo: 122, regNo: '24091A05B0', name: 'KALASAMUDRAM JAYASREE', section: 'Group 1' },
  { sNo: 123, regNo: '24091A05B2', name: 'RAGE JOSHITHA', section: 'Group 1' },
  { sNo: 124, regNo: '24091A05B3', name: 'ATTAR JUBEDA', section: 'Group 1' },
  { sNo: 125, regNo: '24091A05B4', name: 'CHINTHA JYOSHNA', section: 'Group 1' },
  { sNo: 126, regNo: '24091A05B5', name: 'VALLAMKONDA JYOTHSNA', section: 'Group 1' },
  { sNo: 127, regNo: '24091A05B6', name: 'HANUMANTHARAYAPPA GARI KANCHANA', section: 'Group 1' },
  { sNo: 128, regNo: '24091A05B7', name: 'BADUBHAIGARI KARISHMA', section: 'Group 1' },
  { sNo: 129, regNo: '24091A05B8', name: 'MUCHUKOTA KARISHMA', section: 'Group 1' },
  { sNo: 130, regNo: '24091A05B9', name: 'GUNOLLA KARTHIK RAJ', section: 'Group 1' },
  { sNo: 131, regNo: '24091A05BA', name: 'LEKKALA KARUNA', section: 'Group 1' },
  { sNo: 132, regNo: '24091A05BB', name: 'KONDA KASIESWARI', section: 'Group 1' },
  { sNo: 133, regNo: '24091A05BC', name: 'KURUVA KAVITHA', section: 'Group 1' },
  { sNo: 134, regNo: '24091A05BD', name: 'SAVAL KAVITHA', section: 'Group 1' },
  { sNo: 135, regNo: '24091A05BE', name: 'GOOTY KAVYA', section: 'Group 1' },
  { sNo: 136, regNo: '24091A05BF', name: 'PUTTAPARTHI KAVYA', section: 'Group 1' },
  { sNo: 137, regNo: '24091A05BG', name: 'PALLE KAVYALATHA REDDY', section: 'Group 1' },
  { sNo: 138, regNo: '24091A05BH', name: 'MATAM KEDHARESWAR', section: 'Group 1' },
  { sNo: 139, regNo: '24091A05BJ', name: 'SHAIK KOLIMI ABDUL NOOR AHAMED', section: 'Group 1' },
  { sNo: 140, regNo: '24091A05BK', name: 'SHAIK KOUSARUNNISA', section: 'Group 1' },
  { sNo: 141, regNo: '24091A05BM', name: 'BHUMA KOWSHIK REDDY', section: 'Group 1' },
  { sNo: 142, regNo: '24091A05BN', name: 'NULAKACHANDANAM KRISHNA MOHAN', section: 'Group 1' },
  { sNo: 143, regNo: '24091A05BQ', name: 'GOLLA LAKSHMI BRAHMANI', section: 'Group 1' },
  { sNo: 144, regNo: '24091A05BR', name: 'PULUKUNTA LATHA', section: 'Group 1' },
  { sNo: 145, regNo: '24091A05BS', name: 'NEEL LEKHANA', section: 'Group 1' },
  { sNo: 146, regNo: '24091A05BT', name: 'VADUGURU LIKHITH SAI YADAV', section: 'Group 1' },
  { sNo: 147, regNo: '24091A05BU', name: 'JINKA LIKHITHA', section: 'Group 1' },
  { sNo: 148, regNo: '24091A05BV', name: 'GURRAM LIKITHA', section: 'Group 1' },
  { sNo: 149, regNo: '24091A05BW', name: 'POREDDY LIKITHA REDDY', section: 'Group 1' },
  { sNo: 150, regNo: '24091A05BX', name: 'GAMPALAUPPARA LOKESH', section: 'Group 1' },
  { sNo: 151, regNo: '24091A05BY', name: 'BOOSIREDDYGARI LOKESH REDDY', section: 'Group 1' },
  { sNo: 152, regNo: '24091A05C0', name: 'PAMULURU LOKESH REDDY', section: 'Group 1' },
  { sNo: 153, regNo: '24091A05C1', name: 'CHALLA MADHU JAHNAVI', section: 'Group 1' },
  { sNo: 154, regNo: '24091A05C2', name: 'JANGAM MADHU SUDHAN REDDY', section: 'Group 1' },
  { sNo: 155, regNo: '24091A05C3', name: 'SYED MADIHA NOORAIN', section: 'Group 1' },
  { sNo: 156, regNo: '24091A05C4', name: 'UPPALAPADU MAHABOOB BASHA', section: 'Group 1' },
  { sNo: 157, regNo: '24091A05C5', name: 'NANDAVARAM MAHALAKSHMI', section: 'Group 1' },
  { sNo: 158, regNo: '24091A05C6', name: 'BUDATALA MAHAMMAD RAFI', section: 'Group 1' },
  { sNo: 159, regNo: '24091A05C7', name: 'SHAIK MAHAMMED MEHEER', section: 'Group 1' },
  { sNo: 160, regNo: '24091A05C8', name: 'SIMHANAGARI MAHIDHARA CHARYULU', section: 'Group 1' },
  { sNo: 161, regNo: '24091A05C9', name: 'BOLLU MAHIDHAR', section: 'Group 1' },
  { sNo: 162, regNo: '24091A05CA', name: 'CHENNASUBBANNAGAARI MAHITHA', section: 'Group 1' },
  { sNo: 163, regNo: '24091A05CB', name: 'BOYA MALLIKA', section: 'Group 1' },
  { sNo: 164, regNo: '24091A05CC', name: 'PAIDIKALA MAMATHA', section: 'Group 1' },
  { sNo: 165, regNo: '24091A05CD', name: 'MANTHULA MANASA', section: 'Group 1' },
  { sNo: 166, regNo: '24091A05CE', name: 'CHINTHAGINJALA MANASA VEENA', section: 'Group 1' },
  { sNo: 167, regNo: '24091A05CF', name: 'KETHAGANI MANI DIVYA', section: 'Group 1' },
  { sNo: 168, regNo: '24091A05CG', name: 'BINGIMALLA MANIDEEP', section: 'Group 1' },
  { sNo: 169, regNo: '24091A05CH', name: 'GOLLA MANITEJA', section: 'Group 1' },
  { sNo: 170, regNo: '24091A05CJ', name: 'TALARI MANJUNATH NAIDU', section: 'Group 1' },
  { sNo: 171, regNo: '24091A05CK', name: 'GOPISETTY MANJUSHA', section: 'Group 1' },
  { sNo: 172, regNo: '24091A05CM', name: 'BUKKE MANOGNA SREE', section: 'Group 1' },
  { sNo: 173, regNo: '24091A05CN', name: 'KASIREDDY MANOHAR REDDY', section: 'Group 1' },
  { sNo: 174, regNo: '24091A05CP', name: 'JARIPITI MANOJ KUMAR', section: 'Group 1' },
  { sNo: 175, regNo: '24091A05CQ', name: 'GOLLA MAYAVATHI YADAV', section: 'Group 1' },
  { sNo: 176, regNo: '24091A05CR', name: 'KATTUBADI MEENAKSHI', section: 'Group 1' },
  { sNo: 177, regNo: '24091A05CS', name: 'KODURU MEGHANA', section: 'Group 1' },
  { sNo: 178, regNo: '24091A05CT', name: 'GUNDAMPALLI MERCY PARIMALA', section: 'Group 1' },
  { sNo: 179, regNo: '24091A05CU', name: 'TADIMARRI MOHAMMAD GHOUSE FARHAAN', section: 'Group 1' },
  { sNo: 180, regNo: '24091A05CV', name: 'DARGA MOHAMMAD INTHIYAZ', section: 'Group 1' },
  { sNo: 181, regNo: '24091A05CX', name: 'SHAIK MOHAMMAD ZAKIR ALI', section: 'Group 1' },
  { sNo: 182, regNo: '24091A05CY', name: 'DUDEKULA MOHAMMED ASIF', section: 'Group 1' },
  { sNo: 183, regNo: '24091A05D0', name: 'KURUVA GUDISE MOHAN', section: 'Group 1' },
  { sNo: 184, regNo: '24091A05D1', name: 'PALLE MOKSHITHA', section: 'Group 1' },
  { sNo: 185, regNo: '24091A05D2', name: 'GUTTAPALYAM MOUNA SREE', section: 'Group 1' },
  { sNo: 186, regNo: '24091A05D3', name: 'GORANTLA MOUNIKA', section: 'Group 1' },
  { sNo: 187, regNo: '24091A05D4', name: 'S MOUNIKA', section: 'Group 1' },
  { sNo: 188, regNo: '24091A05D5', name: 'SUGALI MUDAVATH MAHESH NAIK', section: 'Group 1' },
  { sNo: 189, regNo: '24091A05D6', name: 'SHAIK MUSKAN', section: 'Group 1' },
  { sNo: 190, regNo: '24091A05D7', name: 'SHAIK NABRA SALMAN', section: 'Group 1' },
  { sNo: 191, regNo: '24091A05D8', name: 'CHAKALI NAGA GOURI', section: 'Group 1' },
  { sNo: 192, regNo: '24091A05D9', name: 'RAMINENI NAGA PAVANI', section: 'Group 1' },
  { sNo: 193, regNo: '24091A05DA', name: 'GAJULA NAGA SAI MADHURI', section: 'Group 1' },
  { sNo: 194, regNo: '24091A05DB', name: 'GAJJALA NAGA SAI PHANINDRA', section: 'Group 1' },
  { sNo: 195, regNo: '25095A0501', name: 'S ABU BAKKAR', section: 'Group 1' },
  { sNo: 196, regNo: '25095A0502', name: 'TUGGALI ASHOK KUMAR', section: 'Group 1' },
  { sNo: 197, regNo: '25095A0504', name: 'ESKALA BHAVYASRI', section: 'Group 1' },
  { sNo: 198, regNo: '25095A0505', name: 'YERRAMSETTY CHOWDAIAH', section: 'Group 1' },
  { sNo: 199, regNo: '25095A0506', name: 'BYALLA DURGA LAKSHMI NARASIMHA', section: 'Group 1' },
  { sNo: 200, regNo: '25095A0507', name: 'PITHAVATH EKANTH NAIK', section: 'Group 1' },
  { sNo: 201, regNo: '25095A0508', name: 'BAPANAPALLI GURU NITHIN', section: 'Group 1' },
  { sNo: 202, regNo: '25095A0509', name: 'CHEEKATI HARSHITHA', section: 'Group 1' },
  { sNo: 203, regNo: '25095A0510', name: 'CHENNAPUREDDY JEEVA SRI', section: 'Group 1' },
  { sNo: 204, regNo: '25095A0511', name: 'VASANTHAM KALYAN', section: 'Group 1' },
  { sNo: 205, regNo: '25095A0512', name: 'G KEERTHANA', section: 'Group 1' },
  { sNo: 206, regNo: '25095A0513', name: 'DUDEKULA KHALEEL BASHA', section: 'Group 1' },
  { sNo: 207, regNo: '25095A0515', name: 'KARNA LAVANYA', section: 'Group 1' },
  { sNo: 208, regNo: '25095A0516', name: 'SWARNA MAHESH BABU', section: 'Group 1' },
  { sNo: 209, regNo: '25095A0518', name: 'CHENNAMSETTY MAHESWARA', section: 'Group 1' },
  { sNo: 210, regNo: '25095A0519', name: 'GORUVA MANASA SREE', section: 'Group 1' },
  { sNo: 211, regNo: '25095A0520', name: 'GOLLA MANJUNATH', section: 'Group 1' },
  { sNo: 212, regNo: '25095A0521', name: 'SHAIK MOHAMMAD ASLAM', section: 'Group 1' },
  { sNo: 213, regNo: '25095A0522', name: 'KURUVA MOHAN', section: 'Group 1' },
  { sNo: 214, regNo: '25095A0523', name: 'KOMANDURU MOKSHAGNA TEJA', section: 'Group 1' },
  { sNo: 215, regNo: '25095A0524', name: 'BARRENKALA NAGA PREETHI', section: 'Group 1' },
  { sNo: 216, regNo: '25095A0525', name: 'CHINTHA NARAHARI', section: 'Group 1' },
  { sNo: 217, regNo: '24091A05DC', name: 'BETHI NAGA SINDHURA', section: 'Group 2' },
  { sNo: 218, regNo: '24091A05DD', name: 'REDDICHERLA NAGA SRAVANI', section: 'Group 2' },
  { sNo: 219, regNo: '24091A05DE', name: 'CHEPPALLI NAGA SUDHA PARIMALA', section: 'Group 2' },
  { sNo: 220, regNo: '24091A05DF', name: 'BHATTU NAGA VENKATESH RAJU', section: 'Group 2' },
  { sNo: 221, regNo: '24091A05DH', name: 'GALLA NANDA KISHORE REDDY', section: 'Group 2' },
  { sNo: 222, regNo: '24091A05DJ', name: 'KODADALA NANDINI', section: 'Group 2' },
  { sNo: 223, regNo: '24091A05DK', name: 'MALLARAPU NANDINI', section: 'Group 2' },
  { sNo: 224, regNo: '24091A05DM', name: 'SAPPOGU NANDINI', section: 'Group 2' },
  { sNo: 225, regNo: '24091A05DN', name: 'THOTA NANDINI', section: 'Group 2' },
  { sNo: 226, regNo: '24091A05DP', name: 'GAJULA NARASIMHA', section: 'Group 2' },
  { sNo: 227, regNo: '24091A05DQ', name: 'DHUNATHALA NARASIMHA REDDY', section: 'Group 2' },
  { sNo: 228, regNo: '24091A05DR', name: 'SHAIK NASREEN BANU', section: 'Group 2' },
  { sNo: 229, regNo: '24091A05DS', name: 'ANDLURU NAVITHA', section: 'Group 2' },
  { sNo: 230, regNo: '24091A05DT', name: 'MANTRI NAVITHA', section: 'Group 2' },
  { sNo: 231, regNo: '24091A05DU', name: 'MANDIPALLI NAVYA', section: 'Group 2' },
  { sNo: 232, regNo: '24091A05DV', name: 'N NAVYA', section: 'Group 2' },
  { sNo: 233, regNo: '24091A05DW', name: 'GANGULA NAVYASREE', section: 'Group 2' },
  { sNo: 234, regNo: '24091A05DX', name: 'MOLLA NAYEEM', section: 'Group 2' },
  { sNo: 235, regNo: '24091A05DY', name: 'GONTLA NIHARIKA', section: 'Group 2' },
  { sNo: 236, regNo: '24091A05E0', name: 'PUJARI NIHARIKA', section: 'Group 2' },
  { sNo: 237, regNo: '24091A05E1', name: 'DHAYEPULE NIKHIL', section: 'Group 2' },
  { sNo: 238, regNo: '24091A05E2', name: 'POTHULARAJU NIKHILA', section: 'Group 2' },
  { sNo: 239, regNo: '24091A05E3', name: 'PINNAPURAM NIRANJAN', section: 'Group 2' },
  { sNo: 240, regNo: '24091A05E4', name: 'BHAIRI NITHIN', section: 'Group 2' },
  { sNo: 241, regNo: '24091A05E5', name: 'SHAIK NOOR MAHAMMAD', section: 'Group 2' },
  { sNo: 242, regNo: '24091A05E6', name: 'BANGI PARAMESH', section: 'Group 2' },
  { sNo: 243, regNo: '24091A05E7', name: 'SALKAPURAM PARINAY', section: 'Group 2' },
  { sNo: 244, regNo: '24091A05E8', name: 'GAVVALA PAVAN', section: 'Group 2' },
  { sNo: 245, regNo: '24091A05E9', name: 'KOTHAREDDYGARI PAVAN KUMAR REDDY', section: 'Group 2' },
  { sNo: 246, regNo: '24091A05EA', name: 'ARAVETI PRABHAS', section: 'Group 2' },
  { sNo: 247, regNo: '24091A05EB', name: 'KANCHARLA PRAGNA', section: 'Group 2' },
  { sNo: 248, regNo: '24091A05EC', name: 'SINGAVARAM PRANADEEP', section: 'Group 2' },
  { sNo: 249, regNo: '24091A05ED', name: 'SAIDAM PRASHANTH', section: 'Group 2' },
  { sNo: 250, regNo: '24091A05EF', name: 'MUKKARA PRAVALLIKA', section: 'Group 2' },
  { sNo: 251, regNo: '24091A05EG', name: 'KONETI PRAVEEN KUMAR', section: 'Group 2' },
  { sNo: 252, regNo: '24091A05EH', name: 'DARAPOGU PREETHAM PAUL', section: 'Group 2' },
  { sNo: 253, regNo: '24091A05EJ', name: 'PUTTA PUJITHA', section: 'Group 2' },
  { sNo: 254, regNo: '24091A05EK', name: 'PILLILLA PUNITH SAI', section: 'Group 2' },
  { sNo: 255, regNo: '24091A05EM', name: 'PAGIREDDY GARI RAGHUNATH REDDY', section: 'Group 2' },
  { sNo: 256, regNo: '24091A05EN', name: 'MADHANI RAGHUVARDHAN', section: 'Group 2' },
  { sNo: 257, regNo: '24091A05EP', name: 'SANKARAPU RAJESH', section: 'Group 2' },
  { sNo: 258, regNo: '24091A05EQ', name: 'KUNCHAM RAJITHA', section: 'Group 2' },
  { sNo: 259, regNo: '24091A05ER', name: 'PARLAPALLI RAMANJANEYULU', section: 'Group 2' },
  { sNo: 260, regNo: '24091A05ES', name: 'ADAVI RAVI PRASAD', section: 'Group 2' },
  { sNo: 261, regNo: '24091A05EU', name: 'KASUKURTHI REENA', section: 'Group 2' },
  { sNo: 262, regNo: '24091A05EV', name: 'KAVALI RISHI KUMAR', section: 'Group 2' },
  { sNo: 263, regNo: '24091A05EW', name: 'CHITRAGAR ROHIN RAJ VARMA', section: 'Group 2' },
  { sNo: 264, regNo: '24091A05EX', name: 'SHAIK RUBANA', section: 'Group 2' },
  { sNo: 265, regNo: '24091A05EY', name: 'TELLA RUCHITHA', section: 'Group 2' },
  { sNo: 266, regNo: '24091A05F0', name: 'N SAHANA', section: 'Group 2' },
  { sNo: 267, regNo: '24091A05F1', name: 'CHILLA SAI', section: 'Group 2' },
  { sNo: 268, regNo: '24091A05F2', name: 'BASIREDDY SAI DEEKSHITH REDDY', section: 'Group 2' },
  { sNo: 269, regNo: '24091A05F3', name: 'GUDDETI SAI HRUDAN', section: 'Group 2' },
  { sNo: 270, regNo: '24091A05F4', name: 'POOJARI SAI KIRAN', section: 'Group 2' },
  { sNo: 271, regNo: '24091A05F5', name: 'YERUVA SAIKUMAR', section: 'Group 2' },
  { sNo: 272, regNo: '24091A05F6', name: 'KOTHAMIDDE SAI NIHARIKA', section: 'Group 2' },
  { sNo: 273, regNo: '24091A05F7', name: 'GOLLA SAI NIRANJAN', section: 'Group 2' },
  { sNo: 274, regNo: '24091A05F8', name: 'PARNAPALLI SAI', section: 'Group 2' },
  { sNo: 275, regNo: '24091A05F9', name: 'MUDDARASU SAI RUKMINI', section: 'Group 2' },
  { sNo: 276, regNo: '24091A05FA', name: 'THIRUNAGARI SAI TEJESH', section: 'Group 2' },
  { sNo: 277, regNo: '24091A05FB', name: 'MUTHUKURU SAI VIGNESHWAR REDDY', section: 'Group 2' },
  { sNo: 278, regNo: '24091A05FC', name: 'KANUGALA SAILAJA', section: 'Group 2' },
  { sNo: 279, regNo: '24091A05FD', name: 'JARRIPOTHU SAILESH', section: 'Group 2' },
  { sNo: 280, regNo: '24091A05FE', name: 'JALLA SAINATH REDDY', section: 'Group 2' },
  { sNo: 281, regNo: '24091A05FF', name: 'KADAPA SAIRA BHANU', section: 'Group 2' },
  { sNo: 282, regNo: '24091A05FG', name: 'KOKA SAKIB RIHAN', section: 'Group 2' },
  { sNo: 283, regNo: '24091A05FJ', name: 'RAMAVATH SAMA NAIK', section: 'Group 2' },
  { sNo: 284, regNo: '24091A05FK', name: 'BANDI SAMAIKYA', section: 'Group 2' },
  { sNo: 285, regNo: '24091A05FM', name: 'GALI SAMARESWAR REDDY', section: 'Group 2' },
  { sNo: 286, regNo: '24091A05FN', name: 'KHALEEL SAMINA BEGUM', section: 'Group 2' },
  { sNo: 287, regNo: '24091A05FP', name: 'KOGATAM SAMPATH REDDY', section: 'Group 2' },
  { sNo: 288, regNo: '24091A05FQ', name: 'ONTEDDU SANDEEP REDDY', section: 'Group 2' },
  { sNo: 289, regNo: '24091A05FS', name: 'MODDU SANTHOSH', section: 'Group 2' },
  { sNo: 290, regNo: '24091A05FT', name: 'MANDEM SANTHOSH', section: 'Group 2' },
  { sNo: 291, regNo: '24091A05FU', name: 'KETHIREDDY SANTHOSH REDDY', section: 'Group 2' },
  { sNo: 292, regNo: '24091A05FV', name: 'KATAMANI SANTHOSH YADAV', section: 'Group 2' },
  { sNo: 293, regNo: '24091A05FW', name: 'PARADESI SATEESH KUMAR', section: 'Group 2' },
  { sNo: 294, regNo: '24091A05FX', name: 'SYED SAZIA ANJUM', section: 'Group 2' },
  { sNo: 295, regNo: '24091A05FY', name: 'MUKKARA SHAHALYA', section: 'Group 2' },
  { sNo: 296, regNo: '24091A05G0', name: 'KURUVA SHAILAJA', section: 'Group 2' },
  { sNo: 297, regNo: '24091A05G1', name: 'MALLELA SHAINI', section: 'Group 2' },
  { sNo: 298, regNo: '24091A05G2', name: 'PINJARI SHAMEER', section: 'Group 2' },
  { sNo: 299, regNo: '24091A05G3', name: 'BANDALA SHAMEERA', section: 'Group 2' },
  { sNo: 300, regNo: '24091A05G4', name: 'A R SHASHANK', section: 'Group 2' },
  { sNo: 301, regNo: '24091A05G5', name: 'KUMMARI SHASHIKANTH', section: 'Group 2' },
  { sNo: 302, regNo: '24091A05G6', name: 'TONDALADINNE SHIEMA', section: 'Group 2' },
  { sNo: 303, regNo: '24091A05G7', name: 'JADAPOLU SHIREESHA', section: 'Group 2' },
  { sNo: 304, regNo: '24091A05G8', name: 'GOLLA SHIVA RAJ KUMAR', section: 'Group 2' },
  { sNo: 305, regNo: '24091A05G9', name: 'KANCHABOINA SHIVA SHANKAR', section: 'Group 2' },
  { sNo: 306, regNo: '24091A05GA', name: 'BOHARA SHIVANI KUMARI', section: 'Group 2' },
  { sNo: 307, regNo: '24091A05GB', name: 'PAPPU SHOBHA RANI', section: 'Group 2' },
  { sNo: 308, regNo: '24091A05GC', name: 'MEKALA SINDHU', section: 'Group 2' },
  { sNo: 309, regNo: '24091A05GD', name: 'BOGGARAPU SIRI CHANDANA', section: 'Group 2' },
  { sNo: 310, regNo: '24091A05GE', name: 'GADIGE SIRI', section: 'Group 2' },
  { sNo: 311, regNo: '24091A05GF', name: 'KONDREDDY SIRILATHA REDDY', section: 'Group 2' },
  { sNo: 312, regNo: '24091A05GG', name: 'CHIMPIRI SIVA KUMAR REDDY', section: 'Group 2' },
  { sNo: 313, regNo: '24091A05GH', name: 'MUDE SIVA SANKAR NAIK', section: 'Group 2' },
  { sNo: 314, regNo: '24091A05GJ', name: 'GAVVALA SONY', section: 'Group 2' },
  { sNo: 315, regNo: '24091A05GK', name: 'SHAGAPURAM SOUNDARYA MANI', section: 'Group 2' },
  { sNo: 316, regNo: '24091A05GM', name: 'GONAVARAM SPANDANA', section: 'Group 2' },
  { sNo: 317, regNo: '24091A05GN', name: 'GADDALA SPANDANA', section: 'Group 2' },
  { sNo: 318, regNo: '24091A05GP', name: 'AMARAVATHI SRAVANI', section: 'Group 2' },
  { sNo: 319, regNo: '24091A05GQ', name: 'CHAKALI SRAVANI', section: 'Group 2' },
  { sNo: 320, regNo: '24091A05GR', name: 'REDYAM SRAVANTHI', section: 'Group 2' },
  { sNo: 321, regNo: '24091A05GS', name: 'PARAKATI SREE HARI', section: 'Group 2' },
  { sNo: 322, regNo: '24091A05GT', name: 'PAGADALA SREE VISHNU PRANEETH', section: 'Group 2' },
  { sNo: 323, regNo: '24091A05GU', name: 'KALVAPALLI SREELATHA', section: 'Group 2' },
  { sNo: 324, regNo: '24091A05GV', name: 'YERUKALA SREERAMULA PRASANNA', section: 'Group 2' },
  { sNo: 325, regNo: '24091A05GW', name: 'RENDLA SREEVIDHYA REDDY', section: 'Group 2' },
  { sNo: 326, regNo: '24091A05GX', name: 'KUMPATI SREEVIGNA', section: 'Group 2' },
  { sNo: 327, regNo: '24091A05GY', name: 'ANNAVARJALA SRIHITHA SARMA', section: 'Group 2' },
  { sNo: 328, regNo: '24091A05H0', name: 'NEERUKATTU SRIKANTH', section: 'Group 2' },
  { sNo: 329, regNo: '24091A05H1', name: 'THALIKOTA SRINIDHI', section: 'Group 2' },
  { sNo: 330, regNo: '24091A05H2', name: 'GIDDALURU SRINIVASULU', section: 'Group 2' },
  { sNo: 331, regNo: '24091A05H3', name: 'BANDIKARI SRIVANI', section: 'Group 2' },
  { sNo: 332, regNo: '24091A05H5', name: 'KURUBA SUDEEP', section: 'Group 2' },
  { sNo: 333, regNo: '24091A05H6', name: 'SIRASALA SUMANTH', section: 'Group 2' },
  { sNo: 334, regNo: '24091A05H8', name: 'SURIPOGULA SUNIL KUMAR', section: 'Group 2' },
  { sNo: 335, regNo: '24091A05H9', name: 'DASARI SUNKARA MEENAKSHI', section: 'Group 2' },
  { sNo: 336, regNo: '24091A05HA', name: 'PESALA SURENDRA KUMAR', section: 'Group 2' },
  { sNo: 337, regNo: '24091A05HB', name: 'BERI SURYA KIRAN', section: 'Group 2' },
  { sNo: 338, regNo: '24091A05HC', name: 'BOREDDY SURYA PRAKASH REDDY', section: 'Group 2' },
  { sNo: 339, regNo: '24091A05HD', name: 'GANGIREDDY SUSHMA', section: 'Group 2' },
  { sNo: 340, regNo: '24091A05HE', name: 'BAPANAPALLI SUSHMITHA', section: 'Group 2' },
  { sNo: 341, regNo: '24091A05HF', name: 'SATTI SUSHMITHA', section: 'Group 2' },
  { sNo: 342, regNo: '24091A05HG', name: 'KAMPALLE SUSMITHA', section: 'Group 2' },
  { sNo: 343, regNo: '24091A05HH', name: 'PARLLAPALLI SUSMITHA', section: 'Group 2' },
  { sNo: 344, regNo: '24091A05HJ', name: 'PEDDAPOTHULA SWARUPA', section: 'Group 2' },
  { sNo: 345, regNo: '24091A05HK', name: 'KURUVA TARAK RAM', section: 'Group 2' },
  { sNo: 346, regNo: '24091A05HM', name: 'POKURI TEJA LAKSHMANA', section: 'Group 2' },
  { sNo: 347, regNo: '24091A05HN', name: 'NARASAPURAM TEJA', section: 'Group 2' },
  { sNo: 348, regNo: '24091A05HP', name: 'ANNEM TEJASREE REDDY', section: 'Group 2' },
  { sNo: 349, regNo: '24091A05HQ', name: 'MUKKOTI TEJASWI', section: 'Group 2' },
  { sNo: 350, regNo: '24091A05HR', name: 'PEDDAYYA GARI THANMAYE', section: 'Group 2' },
  { sNo: 351, regNo: '24091A05HS', name: 'KOLLE THARUN', section: 'Group 2' },
  { sNo: 352, regNo: '24091A05HT', name: 'PALEPALLI THARUN KUMAR REDDY', section: 'Group 2' },
  { sNo: 353, regNo: '24091A05HU', name: 'RAMAVATH THARUN NAIK', section: 'Group 2' },
  { sNo: 354, regNo: '24091A05HV', name: 'KURVA THARUN TEJA', section: 'Group 2' },
  { sNo: 355, regNo: '24091A05HW', name: 'KOPPERLA THARUNI', section: 'Group 2' },
  { sNo: 356, regNo: '24091A05HX', name: 'B TILAK KUMAR REDDY', section: 'Group 2' },
  { sNo: 357, regNo: '24091A05HY', name: 'NELLORE UDAY KIRAN', section: 'Group 2' },
  { sNo: 358, regNo: '24091A05J0', name: 'BAYIKATI UDAYA CHANDRIKA', section: 'Group 2' },
  { sNo: 359, regNo: '24091A05J1', name: 'DEVATI UDAYASREE', section: 'Group 2' },
  { sNo: 360, regNo: '24091A05J2', name: 'VEERAMREDDYGARI UDAYESWAR REDDY', section: 'Group 2' },
  { sNo: 361, regNo: '24091A05J3', name: 'NARALA UPENDRA', section: 'Group 2' },
  { sNo: 362, regNo: '24091A05J4', name: 'EEDIGA URMILA', section: 'Group 2' },
  { sNo: 363, regNo: '24091A05J5', name: 'GAJA VAMSI', section: 'Group 2' },
  { sNo: 364, regNo: '24091A05J6', name: 'METI VAMSI KRISHNA', section: 'Group 2' },
  { sNo: 365, regNo: '24091A05J7', name: 'VENGANNAGARI VARDHAN', section: 'Group 2' },
  { sNo: 366, regNo: '24091A05J8', name: 'AKULA VARSHINI', section: 'Group 2' },
  { sNo: 367, regNo: '24091A05J9', name: 'RAGE VARSHINI', section: 'Group 2' },
  { sNo: 368, regNo: '24091A05JB', name: 'NANGANA VASU KUMAR REDDY', section: 'Group 2' },
  { sNo: 369, regNo: '24091A05JC', name: 'SOMA VEDA ASRITHA', section: 'Group 2' },
  { sNo: 370, regNo: '24091A05JD', name: 'DARSANAM VENKATA ARAVIND', section: 'Group 2' },
  { sNo: 371, regNo: '24091A05JE', name: 'NALLABALLE VENKATA BHAVANA', section: 'Group 2' },
  { sNo: 372, regNo: '24091A05JF', name: 'K VENKATA BHUVANESH', section: 'Group 2' },
  { sNo: 373, regNo: '24091A05JG', name: 'BASIREDDY VENKATA HARSHA VARDHAN REDDY', section: 'Group 2' },
  { sNo: 374, regNo: '24091A05JH', name: 'PULLURU VENKATA JAYANTH', section: 'Group 2' },
  { sNo: 375, regNo: '24091A05JJ', name: 'BOLIGALLA VENKATA KAMALANATH', section: 'Group 2' },
  { sNo: 376, regNo: '24091A05JK', name: 'GANJIKUNTA VENKATA LOKESH', section: 'Group 2' },
  { sNo: 377, regNo: '24091A05JM', name: 'YEKKALURI VENKATA NAGESWARI', section: 'Group 2' },
  { sNo: 378, regNo: '24091A05JN', name: 'AVULA VENKATA PRUDHVINATH REDDY', section: 'Group 2' },
  { sNo: 379, regNo: '24091A05JP', name: 'TAMMISETTY VENKATA RAHUL SANTOSH', section: 'Group 2' },
  { sNo: 380, regNo: '24091A05JQ', name: 'POLURI VENKATA RITHWIQ', section: 'Group 2' },
  { sNo: 381, regNo: '24091A05JR', name: 'YAKKALI VENKATA SAI GOWTHAM', section: 'Group 2' },
  { sNo: 382, regNo: '24091A05JS', name: 'POOJARI VENKATA SAI', section: 'Group 2' },
  { sNo: 383, regNo: '24091A05JU', name: 'KAMMARI VENKATA SIVA HARI PRASAD ACHARI', section: 'Group 2' },
  { sNo: 384, regNo: '24091A05JV', name: 'ADINENI VENKATA TEJASHWINI', section: 'Group 2' },
  { sNo: 385, regNo: '24091A05JX', name: 'SINGAM VENKATA YAMINI', section: 'Group 2' },
  { sNo: 386, regNo: '24091A05JY', name: 'BATHULA VENKATA SAGAR', section: 'Group 2' },
  { sNo: 387, regNo: '24091A05K0', name: 'GARIKELA VENKATESWARAMMA', section: 'Group 2' },
  { sNo: 388, regNo: '24091A05K1', name: 'BANNURU VENNELA', section: 'Group 2' },
  { sNo: 389, regNo: '24091A05K2', name: 'AAINI VENU', section: 'Group 2' },
  { sNo: 390, regNo: '24091A05K3', name: 'KOTEKAL METHUKULA VIDYA SREE', section: 'Group 2' },
  { sNo: 391, regNo: '24091A05K4', name: 'CHILUKA VIJAYA LAKSHMI', section: 'Group 2' },
  { sNo: 392, regNo: '24091A05K5', name: 'K E VINAY KRISHNA', section: 'Group 2' },
  { sNo: 393, regNo: '24091A05K6', name: 'SIRIVELLA VISHAL BEE', section: 'Group 2' },
  { sNo: 394, regNo: '24091A05K7', name: 'KURUVA VISHNU', section: 'Group 2' },
  { sNo: 395, regNo: '24091A05K8', name: 'KUNDU VISHNU VARDHAN REDDY', section: 'Group 2' },
  { sNo: 396, regNo: '24091A05K9', name: 'PAGIDI KONDALA VISWANATH RAJU', section: 'Group 2' },
  { sNo: 397, regNo: '24091A05KA', name: 'CHETHALA VYSHNAVI', section: 'Group 2' },
  { sNo: 398, regNo: '24091A05KB', name: 'KUMMARI VYSHNAVI', section: 'Group 2' },
  { sNo: 399, regNo: '24091A05KC', name: 'REDDEM YASHASWINI', section: 'Group 2' },
  { sNo: 400, regNo: '24091A05KD', name: 'YERUKALA SREERAMULA YASHASWINI', section: 'Group 2' },
  { sNo: 401, regNo: '24091A05KE', name: 'AKEPOGU YASHODA', section: 'Group 2' },
  { sNo: 402, regNo: '24091A05KG', name: 'KASA YASWANTH', section: 'Group 2' },
  { sNo: 403, regNo: '24091A05KH', name: 'KONETI YASWANTHI', section: 'Group 2' },
  { sNo: 404, regNo: '24091A05KJ', name: 'VELAVALISHAIK YAZAZ AHAMMAD', section: 'Group 2' },
  { sNo: 405, regNo: '24091A05KK', name: 'KALLURI YELLA DEVI', section: 'Group 2' },
  { sNo: 406, regNo: '24091A05KM', name: 'KOTTE YUGANDHAR', section: 'Group 2' },
  { sNo: 407, regNo: '24091A05KN', name: 'GOLLA YUVARAJU', section: 'Group 2' },
  { sNo: 408, regNo: '25095A0526', name: 'PUTHA NITHIL KUMAR REDDY', section: 'Group 2' },
  { sNo: 409, regNo: '25095A0527', name: 'SHAIK NIYAZ HUSSAIN', section: 'Group 2' },
  { sNo: 410, regNo: '25095A0528', name: 'UPPALAPATI PRAKASH', section: 'Group 2' },
  { sNo: 411, regNo: '25095A0529', name: 'TIRUMADARLA PREMKUMAR', section: 'Group 2' },
  { sNo: 412, regNo: '25095A0530', name: 'VISWANATH RAHUL PRASHANTH', section: 'Group 2' },
  { sNo: 413, regNo: '25095A0531', name: 'PYATLA RAJKUMAR', section: 'Group 2' },
  { sNo: 414, regNo: '25095A0532', name: 'KATAM RANA PRATHAP', section: 'Group 2' },
  { sNo: 415, regNo: '25095A0533', name: 'GORLA ROHINI', section: 'Group 2' },
  { sNo: 416, regNo: '25095A0534', name: 'EDIGA SAI KISHAN', section: 'Group 2' },
  { sNo: 417, regNo: '25095A0535', name: 'BELLAM SAI PRIYA', section: 'Group 2' },
  { sNo: 418, regNo: '25095A0536', name: 'KONDIGALLA SANJEEVA KUMAR', section: 'Group 2' },
  { sNo: 419, regNo: '25095A0537', name: 'KOUTHALAM SHARMILA', section: 'Group 2' },
  { sNo: 420, regNo: '25095A0538', name: 'PEDDEETI SINGARAIAH', section: 'Group 2' },
  { sNo: 421, regNo: '25095A0539', name: 'KADAPAGALLA SIVA NAGA KUMAR', section: 'Group 2' },
  { sNo: 422, regNo: '25095A0540', name: 'GAJJI SRUJAN', section: 'Group 2' },
  { sNo: 423, regNo: '25095A0541', name: 'BISETTI SRUTHI', section: 'Group 2' },
  { sNo: 424, regNo: '25095A0542', name: 'YARRAVANDLA UPENDRA', section: 'Group 2' },
  { sNo: 425, regNo: '25095A0543', name: 'CHENNAM VEERA THREYA', section: 'Group 2' },
  { sNo: 426, regNo: '25095A0544', name: 'CHEEMALA VENKATA DHANUNJAYUDU', section: 'Group 2' },
  { sNo: 427, regNo: '25095A0545', name: 'CHAVVALA VENNELA', section: 'Group 2' },
  { sNo: 428, regNo: '25095A0546', name: 'REDDYPOGU VIJAYA RAJU', section: 'Group 2' },
  { sNo: 429, regNo: '25095A0547', name: 'TALARI VIKRAM', section: 'Group 2' },
  { sNo: 430, regNo: '25095A0548', name: 'TAKKASILA YASMIN', section: 'Group 2' },
  { sNo: 431, regNo: '25095A0549', name: 'POOJARI YATHENDRA', section: 'Group 2' },
];

function seedYear3Students(databaseInstance) {
  const d = databaseInstance || db;
  const now = new Date().toISOString();

  console.log(`[SeedYear3] Seeding ${year3StudentsList.length} RGMCET CSE 3rd Year students and creating accounts...`);

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

    for (const s of year3StudentsList) {
      const regUpper = s.regNo.toUpperCase();
      const section = s.section;
      const email = `${regUpper.toLowerCase()}@rgmcet.edu.in`;

      // Default password: Registration Number (salt rounds 8)
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

    // Clean up any stale/dummy Year 3 students not in the official 431 roster
    const officialRegNos = year3StudentsList.map(s => s.regNo.toUpperCase());
    const placeholders = officialRegNos.map(() => '?').join(',');
    const staleStudents = d.prepare(`
      SELECT id, user_id, reg_no FROM students 
      WHERE academic_year = 3 AND UPPER(reg_no) NOT IN (${placeholders})
    `).all(...officialRegNos);

    if (staleStudents.length > 0) {
      console.log(`[SeedYear3] Removing ${staleStudents.length} obsolete Year 3 student records...`);
      for (const st of staleStudents) {
        d.prepare('DELETE FROM selections WHERE student_id = ?').run(st.id);
        d.prepare('DELETE FROM students WHERE id = ?').run(st.id);
        if (st.user_id) {
          d.prepare("DELETE FROM users WHERE id = ? AND role = 'STUDENT'").run(st.user_id);
        }
      }
    }

    // Ensure faculty capacities for Group 2 mappings are updated to at least 78 to accommodate 215 students
    d.prepare("UPDATE faculty_subject_mappings SET capacity = 78 WHERE academic_year = 3 AND target_group = 'Group 2' AND capacity < 78").run();

    d.exec('COMMIT');
    console.log(`[SeedYear3] Completed! Created: ${createdCount}, Updated: ${updatedCount}. Total Year 3 students: ${year3StudentsList.length}`);
    return { createdCount, updatedCount, total: year3StudentsList.length };
  } catch (error) {
    d.exec('ROLLBACK');
    console.error('[SeedYear3] Failed to seed Year 3 students:', error);
    throw error;
  }
}

if (require.main === module) {
  seedYear3Students(db);
}

module.exports = { seedYear3Students, year3StudentsList };
