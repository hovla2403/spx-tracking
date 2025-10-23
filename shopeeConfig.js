// shopeeConfig.js
const shopeeUrl = 'https://shopee.vn/api/v4/account/basic/check_account_exist';

const headers = {
  'accept': 'application/json',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
          'af-ac-enc-dat': '8d7d13f40795dbcc',
          'af-ac-enc-sz-token': 'SZ7yAdq1wQwaCwYOl06b5w==|QwWu/elwpQubRyALN1CtxuOOq/jLCgmaN2Q+xMg7dq/W00hgM2hSGY+jhTRNRl8rid/YixLTV8o=|YbL9DpNxxqXmHuLT|08|3',
          'content-type': 'application/json',
          'cookie': '_fbp=fb.1.1747720164334.517551027144893032; _QPWSDCXHZQA=8c747bd7-9fdf-4eb3-c365-3f87ea819de0; REC7iLP4Q=008f0601-6e67-4abc-a436-90075757266c; SPC_F=PypK2rEU8ofFSzD5cy2Qd7fEfHarhxlX; REC_T_ID=2f8be6e5-353e-11f0-a626-32d0022db7ca; SPC_CLIENTID=UHlwSzJyRVU4b2ZGpprreuvpyehyndyo; _hjSessionUser_868286=eyJpZCI6ImYwYzQwNzAxLTQ2YTktNWE5Ni1hOWE0LTQyNTQzYTNhNWNhMSIsImNyZWF0ZWQiOjE3NDc3MjAxNjg1NzgsImV4aXN0aW5nIjp0cnVlfQ==; SC_DFP=yPahGLsVdNIrWeZONPcmpoyvlGfzngum; _ga_3XVGTY3603=GS2.1.s1749811515$o2$g0$t1749811520$j55$l0$h0; _ga_FV78QC1144=GS2.1.s1751354844$o1$g1$t1751354880$j24$l0$h0; _gcl_au=1.1.1002216337.1755508301; _fbc=fb.1.1756115229567.IwY2xjawMM5WJleHRuA2FlbQIxMABicmlkETFFWTRPZmxiTXdqanFJdzFCAR4hQY3FsFV_eLIj4yA0MdVkkDwidku7QX53eCVHEepr1bTvB3edXKEZHNzlJA_aem_0B4xXtP-dClPQt7NYATeIw; _gac_UA-61914164-6=1.1757334044.CjwKCAjw_fnFBhB0EiwAH_MfZhIo1kVns2YctbxHb88JEkRs9X433jMv3O1Jaqp9UsQFW1EQQDZNEBoCosoQAvD_BwE; _gcl_aw=GCL.1757334044.CjwKCAjw_fnFBhB0EiwAH_MfZhIo1kVns2YctbxHb88JEkRs9X433jMv3O1Jaqp9UsQFW1EQQDZNEBoCosoQAvD_BwE; _ga_4GPP1ZXG63=deleted; _med=affiliates; _ga_TEVYGNDY1K=GS2.1.s1760513034$o1$g1$t1760514744$j60$l0$h0; _gcl_gs=2.1.k1$i1760694136$u252404939; SPC_SI=82PvaAAAAAB5TlNKQ1FpbKNKWgAAAAAAcGlKZXZORVg=; _gid=GA1.2.516414206.1760890816; SPC_U=1378273577; SPC_R_T_ID=m5v5Pw6yJvNilXnY3M6CQIT5v4LSn5d4DM13EpFGhhnEA5jXoELnBSZuG6hLVv6+zklcDL+K5A9OhnWT25fqEHu1F2y50m9jPJ2FcUxcCrbi+Ki4lGOxMQxCDzYMKg7s24KmwqXUZ3WNMzm+mxHOwwbQnw7mfO9ehnQodyoOULM=; SPC_R_T_IV=cGFIREU0YWlOY1RiQWhOag==; SPC_T_ID=m5v5Pw6yJvNilXnY3M6CQIT5v4LSn5d4DM13EpFGhhnEA5jXoELnBSZuG6hLVv6+zklcDL+K5A9OhnWT25fqEHu1F2y50m9jPJ2FcUxcCrbi+Ki4lGOxMQxCDzYMKg7s24KmwqXUZ3WNMzm+mxHOwwbQnw7mfO9ehnQodyoOULM=; SPC_T_IV=cGFIREU0YWlOY1RiQWhOag==; SPC_SEC_SI=v1-aHNmcHVCalA4cUdGY2d2UeRDjq3qNLHykddRLudQspd78UsJvgKe5Zx2qqJ4O+KEKLxbLKG/BOjfKC1IMARrJ0CkIESodAZ5S6qgKsV+K1E=; csrftoken=l5Y2WTP1161etT97nAQh2B0NyeKXNwCX; _sapid=dbaacbdc3fbde7b4def707dedaca04ba096783ab6d03560f870c4be2; SPC_IA=1; SPC_CDS_CHAT=65729d1f-767a-451d-9a88-34307292814e; _ga_VYF4T4BCNH=GS2.1.s1761032235$o19$g0$t1761032235$j60$l0$h0; _hjSession_868286=eyJpZCI6ImUzMzU1N2I5LThiM2ItNGRhYS05OGM0LTdlNjdiYWVmNGM5ZiIsImMiOjE3NjEwNTU3NzUzMzgsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MX0=; AMP_TOKEN=%24NOT_FOUND; shopee_webUnique_ccd=SZ7yAdq1wQwaCwYOl06b5w%3D%3D%7CQwWu%2FelwpQubRyALN1CtxuOOq%2FjLCgmaN2Q%2BxMg7dq%2FW00hgM2hSGY%2BjhTRNRl8rid%2FYixLTV8o%3D%7CYbL9DpNxxqXmHuLT%7C08%7C3; ds=94bc390e642e81b94689016f44697da9; _ga=GA1.1.373907761.1747720168; _ga_4GPP1ZXG63=GS2.1.s1761055775$o596$g1$t1761055854$j58$l1$h746865082',
          'origin': 'https://shopee.vn',
          'priority': 'u=1, i',
          'referer': 'https://shopee.vn/buyer/reset?scenario=7',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'x-api-source': 'pc',
          'x-csrftoken': 'l5Y2WTP1161etT97nAQh2B0NyeKXNwCX',
          'x-requested-with': 'XMLHttpRequest',
          'x-sz-sdk-version': '1.12.22-1',
};

module.exports = { shopeeUrl, headers };
